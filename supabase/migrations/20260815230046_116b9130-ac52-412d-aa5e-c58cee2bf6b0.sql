-- ============================ MARKET LISTINGS ============================
CREATE TABLE public.market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id text NOT NULL REFERENCES public.characters_catalog(id) ON DELETE CASCADE,
  price integer NOT NULL CHECK (price >= 10 AND price <= 10000000),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','cancelled')),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sold_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_listings TO authenticated;
GRANT ALL ON public.market_listings TO service_role;
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings readable" ON public.market_listings FOR SELECT TO authenticated USING (true);
CREATE INDEX market_listings_active_idx ON public.market_listings (status, created_at DESC);
CREATE INDEX market_listings_seller_idx ON public.market_listings (seller_id, status);

CREATE TABLE public.market_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  character_id text NOT NULL,
  price integer NOT NULL,
  tax integer NOT NULL,
  net integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_sales TO authenticated;
GRANT ALL ON public.market_sales TO service_role;
ALTER TABLE public.market_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales readable" ON public.market_sales FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR buyer_id = auth.uid());
CREATE INDEX market_sales_user_idx ON public.market_sales (seller_id, buyer_id, created_at DESC);

-- ================================ TRADES =================================
CREATE TABLE public.card_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer jsonb NOT NULL DEFAULT '[]'::jsonb,
  request jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.card_trades TO authenticated;
GRANT ALL ON public.card_trades TO service_role;
ALTER TABLE public.card_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trades readable" ON public.card_trades FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE INDEX card_trades_parties_idx ON public.card_trades (to_user, status, created_at DESC);

CREATE TRIGGER market_listings_updated_at BEFORE UPDATE ON public.market_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER card_trades_updated_at BEFORE UPDATE ON public.card_trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================ COPY HELPERS ==============================
CREATE OR REPLACE FUNCTION public.take_copy(p_user uuid, p_char text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_left int;
BEGIN
  UPDATE public.user_collection SET count = count - 1
    WHERE user_id = p_user AND character_id = p_char AND count >= 1
    RETURNING count INTO v_left;
  IF v_left IS NULL THEN RETURN false; END IF;
  IF v_left <= 0 THEN
    DELETE FROM public.user_collection WHERE user_id = p_user AND character_id = p_char;
  END IF;
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.take_copy(uuid, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.give_copy(p_user uuid, p_char text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_collection (user_id, character_id, count)
  VALUES (p_user, p_char, 1)
  ON CONFLICT (user_id, character_id) DO UPDATE SET count = public.user_collection.count + 1;
END; $$;
REVOKE EXECUTE ON FUNCTION public.give_copy(uuid, text) FROM public, anon, authenticated;

-- ============================ MARKET RPCS ===============================
CREATE OR REPLACE FUNCTION public.market_list_card(p_character text, p_price int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_id uuid; v_open int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_price IS NULL OR p_price < 10 OR p_price > 10000000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_price'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.characters_catalog WHERE id = p_character) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_card'); END IF;
  SELECT count(*) INTO v_open FROM public.market_listings
    WHERE seller_id = v_user AND status = 'active';
  IF v_open >= 30 THEN RETURN jsonb_build_object('ok', false, 'error', 'too_many_listings'); END IF;
  IF NOT public.take_copy(v_user, p_character) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owned'); END IF;
  INSERT INTO public.market_listings (seller_id, character_id, price)
    VALUES (v_user, p_character, p_price) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'listing_id', v_id);
END; $$;

CREATE OR REPLACE FUNCTION public.market_cancel_listing(p_listing uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_char text;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  UPDATE public.market_listings SET status = 'cancelled'
    WHERE id = p_listing AND seller_id = v_user AND status = 'active'
    RETURNING character_id INTO v_char;
  IF v_char IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  PERFORM public.give_copy(v_user, v_char);
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.market_buy(p_listing uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.market_listings%ROWTYPE;
  v_souls int; v_tax int; v_net int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_row FROM public.market_listings WHERE id = p_listing FOR UPDATE;
  IF v_row.id IS NULL OR v_row.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unavailable'); END IF;
  IF v_row.seller_id = v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'own_listing'); END IF;

  SELECT souls INTO v_souls FROM public.profiles WHERE user_id = v_user FOR UPDATE;
  IF COALESCE(v_souls, 0) < v_row.price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough_souls'); END IF;

  v_tax := (v_row.price * 5) / 100;
  v_net := v_row.price - v_tax;

  UPDATE public.market_listings
    SET status = 'sold', buyer_id = v_user, sold_at = now()
    WHERE id = p_listing AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'unavailable'); END IF;

  UPDATE public.profiles SET souls = souls - v_row.price, updated_at = now() WHERE user_id = v_user;
  UPDATE public.profiles SET souls = COALESCE(souls,0) + v_net,
    total_souls_earned = COALESCE(total_souls_earned,0) + v_net, updated_at = now()
    WHERE user_id = v_row.seller_id;
  PERFORM public.give_copy(v_user, v_row.character_id);

  INSERT INTO public.market_sales (listing_id, seller_id, buyer_id, character_id, price, tax, net)
    VALUES (v_row.id, v_row.seller_id, v_user, v_row.character_id, v_row.price, v_tax, v_net);

  RETURN jsonb_build_object('ok', true, 'character_id', v_row.character_id,
    'price', v_row.price, 'souls', COALESCE(v_souls,0) - v_row.price);
END; $$;

CREATE OR REPLACE FUNCTION public.market_browse(
  p_q text DEFAULT NULL, p_min int DEFAULT NULL, p_max int DEFAULT NULL,
  p_rarity text DEFAULT NULL, p_sort text DEFAULT 'newest', p_limit int DEFAULT 60)
RETURNS TABLE (
  id uuid, character_id text, price int, rarity text, overall int,
  seller_id uuid, seller_name text, created_at timestamptz, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.character_id, l.price, c.rarity, c.overall,
         l.seller_id, p.username, l.created_at, l.seller_id = auth.uid()
  FROM public.market_listings l
  JOIN public.characters_catalog c ON c.id = l.character_id
  LEFT JOIN public.profiles p ON p.user_id = l.seller_id
  WHERE l.status = 'active'
    AND (p_min IS NULL OR l.price >= p_min)
    AND (p_max IS NULL OR l.price <= p_max)
    AND (p_rarity IS NULL OR c.rarity = p_rarity)
    AND (p_q IS NULL OR p_q = '' OR l.character_id ILIKE '%' || p_q || '%')
  ORDER BY
    CASE WHEN p_sort = 'cheapest' THEN l.price END ASC,
    CASE WHEN p_sort = 'expensive' THEN l.price END DESC,
    CASE WHEN p_sort = 'rating' THEN c.overall END DESC,
    l.created_at DESC
  LIMIT LEAST(COALESCE(p_limit, 60), 200);
$$;

CREATE OR REPLACE FUNCTION public.market_my_listings()
RETURNS TABLE (id uuid, character_id text, price int, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, character_id, price, status, created_at FROM public.market_listings
  WHERE seller_id = auth.uid() ORDER BY created_at DESC LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.market_my_history()
RETURNS TABLE (id uuid, character_id text, price int, net int, tax int,
               sold boolean, other_name text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.character_id, s.price, s.net, s.tax,
         s.seller_id = auth.uid(),
         CASE WHEN s.seller_id = auth.uid()
              THEN (SELECT username FROM public.profiles WHERE user_id = s.buyer_id)
              ELSE (SELECT username FROM public.profiles WHERE user_id = s.seller_id) END,
         s.created_at
  FROM public.market_sales s
  WHERE s.seller_id = auth.uid() OR s.buyer_id = auth.uid()
  ORDER BY s.created_at DESC LIMIT 100;
$$;

-- ============================= TRADE RPCS ================================
CREATE OR REPLACE FUNCTION public.trade_create(p_to uuid, p_offer text[], p_request text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_id uuid; v_c text; v_open int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_to IS NULL OR p_to = v_user THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_target'); END IF;
  IF COALESCE(array_length(p_offer,1),0) = 0 AND COALESCE(array_length(p_request,1),0) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_trade'); END IF;
  IF COALESCE(array_length(p_offer,1),0) > 5 OR COALESCE(array_length(p_request,1),0) > 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_many_cards'); END IF;
  SELECT count(*) INTO v_open FROM public.card_trades
    WHERE from_user = v_user AND status = 'pending';
  IF v_open >= 10 THEN RETURN jsonb_build_object('ok', false, 'error', 'too_many_trades'); END IF;

  FOREACH v_c IN ARRAY COALESCE(p_offer, '{}') LOOP
    IF NOT EXISTS (SELECT 1 FROM public.user_collection
                   WHERE user_id = v_user AND character_id = v_c AND count >= 1) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owned'); END IF;
  END LOOP;

  INSERT INTO public.card_trades (from_user, to_user, offer, request)
    VALUES (v_user, p_to, to_jsonb(COALESCE(p_offer,'{}')), to_jsonb(COALESCE(p_request,'{}')))
    RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'trade_id', v_id);
END; $$;

CREATE OR REPLACE FUNCTION public.trade_respond(p_trade uuid, p_accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.card_trades%ROWTYPE;
  v_c text; v_arr text[];
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_row FROM public.card_trades WHERE id = p_trade FOR UPDATE;
  IF v_row.id IS NULL OR v_row.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unavailable'); END IF;

  -- sender may cancel; recipient may accept or decline
  IF v_user = v_row.from_user THEN
    IF p_accept THEN RETURN jsonb_build_object('ok', false, 'error', 'not_recipient'); END IF;
    UPDATE public.card_trades SET status = 'cancelled' WHERE id = p_trade;
    RETURN jsonb_build_object('ok', true, 'status', 'cancelled');
  END IF;
  IF v_user <> v_row.to_user THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;

  IF NOT p_accept THEN
    UPDATE public.card_trades SET status = 'declined' WHERE id = p_trade;
    RETURN jsonb_build_object('ok', true, 'status', 'declined');
  END IF;

  -- validate both sides still own every copy
  v_arr := ARRAY(SELECT jsonb_array_elements_text(v_row.offer));
  FOREACH v_c IN ARRAY v_arr LOOP
    IF NOT EXISTS (SELECT 1 FROM public.user_collection
                   WHERE user_id = v_row.from_user AND character_id = v_c AND count >= 1) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'sender_missing_cards'); END IF;
  END LOOP;
  v_arr := ARRAY(SELECT jsonb_array_elements_text(v_row.request));
  FOREACH v_c IN ARRAY v_arr LOOP
    IF NOT EXISTS (SELECT 1 FROM public.user_collection
                   WHERE user_id = v_row.to_user AND character_id = v_c AND count >= 1) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'you_missing_cards'); END IF;
  END LOOP;

  FOREACH v_c IN ARRAY ARRAY(SELECT jsonb_array_elements_text(v_row.offer)) LOOP
    IF NOT public.take_copy(v_row.from_user, v_c) THEN
      RAISE EXCEPTION 'trade_copy_missing'; END IF;
    PERFORM public.give_copy(v_row.to_user, v_c);
  END LOOP;
  FOREACH v_c IN ARRAY ARRAY(SELECT jsonb_array_elements_text(v_row.request)) LOOP
    IF NOT public.take_copy(v_row.to_user, v_c) THEN
      RAISE EXCEPTION 'trade_copy_missing'; END IF;
    PERFORM public.give_copy(v_row.from_user, v_c);
  END LOOP;

  UPDATE public.card_trades SET status = 'accepted' WHERE id = p_trade;
  RETURN jsonb_build_object('ok', true, 'status', 'accepted');
END; $$;

CREATE OR REPLACE FUNCTION public.trade_my_trades()
RETURNS TABLE (id uuid, from_user uuid, to_user uuid, from_name text, to_name text,
               offer jsonb, request jsonb, status text, incoming boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.from_user, t.to_user,
         (SELECT username FROM public.profiles WHERE user_id = t.from_user),
         (SELECT username FROM public.profiles WHERE user_id = t.to_user),
         t.offer, t.request, t.status, t.to_user = auth.uid(), t.created_at
  FROM public.card_trades t
  WHERE t.from_user = auth.uid() OR t.to_user = auth.uid()
  ORDER BY (t.status = 'pending') DESC, t.created_at DESC
  LIMIT 60;
$$;