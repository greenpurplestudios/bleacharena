INSERT INTO public.characters_catalog (id, rarity, overall, gender)
VALUES ('c-f07', 'founder', 100, 'male')
ON CONFLICT (id) DO UPDATE SET rarity = EXCLUDED.rarity, overall = EXCLUDED.overall, gender = EXCLUDED.gender;