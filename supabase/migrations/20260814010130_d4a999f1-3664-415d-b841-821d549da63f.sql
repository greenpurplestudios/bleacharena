CREATE OR REPLACE FUNCTION public.buy_pack(p_tier text, p_count integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_price integer;
  v_total integer;
  v_souls integer;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_count IS NULL OR p_count < 1 OR p_count > 10 THEN RETURN jsonb_build_object('ok', false, 'error', 'bad_count'); END IF;
  v_price := CASE p_tier
    WHEN 'bronze' THEN 150
    WHEN 'silver' THEN 350
    WHEN 'gold' THEN 700
    WHEN 'ultra' THEN 1400
    WHEN 'legend' THEN 2800
    ELSE NULL END;
  IF v_price IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'bad_tier'); END IF;
  v_total := v_price * p_count;

  SELECT souls INTO v_souls FROM public.profiles WHERE user_id = v_user FOR UPDATE;
  IF v_souls IS NULL OR v_souls < v_total THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_souls', 'price', v_total);
  END IF;

  UPDATE public.profiles SET souls = souls - v_total WHERE user_id = v_user;

  INSERT INTO public.user_packs (user_id, tier, count) VALUES (v_user, p_tier, p_count)
  ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + p_count;

  RETURN jsonb_build_object('ok', true, 'tier', p_tier, 'count', p_count, 'spent', v_total, 'souls', v_souls - v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_pack(text, integer) TO authenticated;