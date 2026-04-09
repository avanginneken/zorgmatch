-- ============================================================
-- ZorgMatch - Migratie 002: Reviews + Zorgvrager Profielen
-- Datum: 2026-03-31
-- Voer uit in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- NIEUWE ENUMS
-- ============================================================

CREATE TYPE review_status AS ENUM (
  'INGEDIEND',   -- Review is ingediend, wacht op wederpartij
  'ZICHTBAAR',   -- Beide partijen hebben ingediend (blind reveal)
  'GEMELD',      -- Gemeld voor onterechte inhoud
  'VERBORGEN'    -- Verborgen door beheerder
);

CREATE TYPE mobiliteit AS ENUM (
  'ZELFSTANDIG',
  'ROLLATOR',
  'ROLSTOEL',
  'BEDLEGERIG'
);

CREATE TYPE reanimatie_status AS ENUM (
  'JA',
  'NEE',
  'ONBEKEND'
);

CREATE TYPE toegang_methode AS ENUM (
  'SLEUTELKLUIS',
  'AANWEZIG_BIJ_AANKOMST',
  'MANTELZORGER',
  'ANDERS'
);

-- ============================================================
-- ZORGVRAGER PROFIELEN
-- Uitgebreide medische en logistieke informatie per zorgvrager
-- ============================================================

CREATE TABLE zorgvrager_profielen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gebruiker_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,

  -- Huisdieren
  huisdieren_aanwezig BOOLEAN,
  huisdier_type TEXT,

  -- Gezondheid & aandachtspunten
  allergieen TEXT,
  medische_aandachtspunten TEXT,
  mobiliteit mobiliteit,

  -- Wilsverklaring
  -- DISCLAIMER: Uitsluitend ter informatie voor de zorgverlener.
  -- ZorgMatch draagt geen medische verantwoordelijkheid.
  reanimatie reanimatie_status,
  dnr_aanwezig BOOLEAN,

  -- Noodinformatie
  noodmedicatie_aanwezig BOOLEAN,
  noodmedicatie_toelichting TEXT,

  -- Noodcontact
  noodcontact_naam TEXT,
  noodcontact_telefoon TEXT,

  -- Toegang tot woning
  -- LET OP: Geen sleutelcodes of pincodes opslaan in dit systeem.
  -- Veld toegang_toelichting is alleen voor beschrijving van de afspraak.
  toegang_methode toegang_methode,
  toegang_toelichting TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gebruiker_id)
);

-- ============================================================
-- REVIEWS
-- Tweerichtings beoordelingssysteem met blind reveal
-- ============================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  reviewer_rol rol NOT NULL,

  -- Gestructureerde scores (1-5), afhankelijk van reviewer_rol:
  -- Door ZORGVRAGER (over zorgverlener):
  --   { "professionaliteit": 4, "communicatie": 5, "punctualiteit": 3, "vertrouwen": 5 }
  -- Door ZORGVERLENER (over zorgvrager):
  --   { "duidelijkheid_vraag": 4, "respectvolle_omgang": 5, "bereikbaarheid": 3 }
  scores JSONB NOT NULL DEFAULT '{}',

  tekst TEXT,
  status review_status NOT NULL DEFAULT 'INGEDIEND',

  -- Melding (door reviewer of reviewee)
  gemeld_door UUID REFERENCES gebruikers(id),
  gemeld_op TIMESTAMPTZ,
  gemeld_reden TEXT,

  -- Beheer beslissing
  beheer_besluit TEXT,
  beheer_besluit_op TIMESTAMPTZ,
  beheer_besluit_door UUID REFERENCES gebruikers(id),

  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Elke partij kan maximaal één review per match geven
  UNIQUE(match_id, reviewer_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_zorgvrager_profielen_gebruiker ON zorgvrager_profielen(gebruiker_id);
CREATE INDEX idx_reviews_match ON reviews(match_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_gemeld ON reviews(gemeld_op) WHERE gemeld_op IS NOT NULL;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

CREATE TRIGGER zorgvrager_profielen_updated_at
  BEFORE UPDATE ON zorgvrager_profielen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Blind reveal
-- Reviews worden zichtbaar zodra beide partijen hebben ingediend.
-- Na 14 dagen worden openstaande reviews automatisch zichtbaar
-- via een scheduled job (in te stellen in Supabase Cron).
-- ============================================================

CREATE OR REPLACE FUNCTION check_blind_reveal()
RETURNS TRIGGER AS $$
DECLARE
  v_match_id UUID;
  v_ingediend_count INTEGER;
BEGIN
  v_match_id := NEW.match_id;

  -- Tel hoeveel reviews voor deze match de status INGEDIEND hebben
  SELECT COUNT(*) INTO v_ingediend_count
  FROM reviews
  WHERE match_id = v_match_id
    AND status = 'INGEDIEND';

  -- Beide partijen hebben ingediend: maak alles zichtbaar
  IF v_ingediend_count >= 2 THEN
    UPDATE reviews
    SET status = 'ZICHTBAAR'
    WHERE match_id = v_match_id
      AND status = 'INGEDIEND';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER blind_reveal_trigger
  AFTER INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW
  WHEN (NEW.status = 'INGEDIEND')
  EXECUTE FUNCTION check_blind_reveal();

-- ============================================================
-- HELPER FUNCTIE: Gemiddelde score per zorgverlener
-- Gebruik: SELECT * FROM get_gemiddelde_scores('gebruiker-uuid');
-- ============================================================

CREATE OR REPLACE FUNCTION get_gemiddelde_scores(p_zorgverlener_id UUID)
RETURNS TABLE (
  totaal_reviews BIGINT,
  gem_professionaliteit NUMERIC,
  gem_communicatie NUMERIC,
  gem_punctualiteit NUMERIC,
  gem_vertrouwen NUMERIC,
  gem_totaal NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS totaal_reviews,
    ROUND(AVG((scores->>'professionaliteit')::NUMERIC), 1) AS gem_professionaliteit,
    ROUND(AVG((scores->>'communicatie')::NUMERIC), 1) AS gem_communicatie,
    ROUND(AVG((scores->>'punctualiteit')::NUMERIC), 1) AS gem_punctualiteit,
    ROUND(AVG((scores->>'vertrouwen')::NUMERIC), 1) AS gem_vertrouwen,
    ROUND(AVG(
      (
        COALESCE((scores->>'professionaliteit')::NUMERIC, 0) +
        COALESCE((scores->>'communicatie')::NUMERIC, 0) +
        COALESCE((scores->>'punctualiteit')::NUMERIC, 0) +
        COALESCE((scores->>'vertrouwen')::NUMERIC, 0)
      ) / 4
    ), 1) AS gem_totaal
  FROM reviews
  WHERE reviewee_id = p_zorgverlener_id
    AND reviewer_rol = 'ZORGVRAGER'
    AND status = 'ZICHTBAAR';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE zorgvrager_profielen ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ----- Zorgvrager profielen -----

-- Eigen profiel lezen
CREATE POLICY "Zorgvrager ziet eigen profiel" ON zorgvrager_profielen
  FOR SELECT USING (gebruiker_id = get_current_gebruiker_id());

-- Beheer leest alles
CREATE POLICY "Beheer ziet alle zorgvrager profielen" ON zorgvrager_profielen
  FOR SELECT USING (get_current_rol() = 'BEHEER');

-- Zorgverlener leest profiel van gekoppelde zorgvrager (actieve match)
CREATE POLICY "Zorgverlener ziet profiel bij bevestigde match" ON zorgvrager_profielen
  FOR SELECT USING (
    get_current_rol() = 'ZORGVERLENER'
    AND EXISTS (
      SELECT 1
      FROM matches m
      JOIN zorgvragen z ON z.id = m.zorgvraag_id
      WHERE m.zorgverlener_id = get_current_gebruiker_id()
        AND z.zorgvrager_id = zorgvrager_profielen.gebruiker_id
        AND m.status IN ('BEVESTIGD', 'AFGEROND')
    )
  );

-- Aanmaken
CREATE POLICY "Zorgvrager maakt eigen profiel aan" ON zorgvrager_profielen
  FOR INSERT WITH CHECK (
    gebruiker_id = get_current_gebruiker_id()
    AND get_current_rol() = 'ZORGVRAGER'
  );

-- Bijwerken
CREATE POLICY "Zorgvrager werkt eigen profiel bij" ON zorgvrager_profielen
  FOR UPDATE USING (gebruiker_id = get_current_gebruiker_id());

-- ----- Reviews -----

-- Reviewer ziet altijd eigen ingediende review
CREATE POLICY "Reviewer ziet eigen review" ON reviews
  FOR SELECT USING (reviewer_id = get_current_gebruiker_id());

-- Reviewee ziet review alleen als deze zichtbaar is (blind reveal)
CREATE POLICY "Reviewee ziet zichtbare review" ON reviews
  FOR SELECT USING (
    reviewee_id = get_current_gebruiker_id()
    AND status = 'ZICHTBAAR'
  );

-- Beheer ziet en beheert alles
CREATE POLICY "Beheer ziet alle reviews" ON reviews
  FOR SELECT USING (get_current_rol() = 'BEHEER');

CREATE POLICY "Beheer beheert alle reviews" ON reviews
  FOR UPDATE USING (get_current_rol() = 'BEHEER');

-- Review indienen (reviewer moet partij zijn bij de match)
CREATE POLICY "Reviewer dient review in" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = get_current_gebruiker_id()
    AND EXISTS (
      SELECT 1 FROM matches m
      JOIN zorgvragen z ON z.id = m.zorgvraag_id
      WHERE m.id = reviews.match_id
        AND m.status = 'AFGEROND'
        AND (
          m.zorgverlener_id = get_current_gebruiker_id()
          OR z.zorgvrager_id = get_current_gebruiker_id()
        )
    )
  );

-- Reviewer kan review melden (UPDATE beperkt tot meld-velden)
CREATE POLICY "Betrokkene kan review melden" ON reviews
  FOR UPDATE USING (
    reviewee_id = get_current_gebruiker_id()
    AND status = 'ZICHTBAAR'
  );

-- ============================================================
-- SUPABASE CRON: 14-dagen fallback (handmatig instellen)
-- Voer in via Supabase Dashboard > Database > Extensions > pg_cron
-- Of via: https://supabase.com/docs/guides/database/extensions/pg_cron
--
-- SELECT cron.schedule(
--   'blind-reveal-fallback',
--   '0 2 * * *',  -- Elke nacht om 02:00
--   $$
--     UPDATE reviews
--     SET status = 'ZICHTBAAR'
--     WHERE status = 'INGEDIEND'
--       AND aangemaakt_op < NOW() - INTERVAL '14 days';
--   $$
-- );
-- ============================================================
