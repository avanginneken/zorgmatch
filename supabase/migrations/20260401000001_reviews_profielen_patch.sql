-- ============================================================
-- Patch: maak ontbrekende tabellen/functies aan als ze nog niet bestaan
-- ============================================================

-- Enums (overgeslagen als ze al bestaan)
DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('INGEDIEND','ZICHTBAAR','GEMELD','VERBORGEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mobiliteit AS ENUM ('ZELFSTANDIG','ROLLATOR','ROLSTOEL','BEDLEGERIG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reanimatie_status AS ENUM ('JA','NEE','ONBEKEND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE toegang_methode AS ENUM ('SLEUTELKLUIS','AANWEZIG_BIJ_AANKOMST','MANTELZORGER','ANDERS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Zorgvrager profielen
CREATE TABLE IF NOT EXISTS zorgvrager_profielen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gebruiker_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  huisdieren_aanwezig BOOLEAN,
  huisdier_type TEXT,
  allergieen TEXT,
  medische_aandachtspunten TEXT,
  mobiliteit mobiliteit,
  reanimatie reanimatie_status,
  dnr_aanwezig BOOLEAN,
  noodmedicatie_aanwezig BOOLEAN,
  noodmedicatie_toelichting TEXT,
  noodcontact_naam TEXT,
  noodcontact_telefoon TEXT,
  toegang_methode toegang_methode,
  toegang_toelichting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gebruiker_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  reviewer_rol rol NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  tekst TEXT,
  status review_status NOT NULL DEFAULT 'INGEDIEND',
  gemeld_door UUID REFERENCES gebruikers(id),
  gemeld_op TIMESTAMPTZ,
  gemeld_reden TEXT,
  beheer_besluit TEXT,
  beheer_besluit_op TIMESTAMPTZ,
  beheer_besluit_door UUID REFERENCES gebruikers(id),
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, reviewer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zorgvrager_profielen_gebruiker ON zorgvrager_profielen(gebruiker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_match ON reviews(match_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_gemeld ON reviews(gemeld_op) WHERE gemeld_op IS NOT NULL;

-- Triggers
DROP TRIGGER IF EXISTS zorgvrager_profielen_updated_at ON zorgvrager_profielen;
CREATE TRIGGER zorgvrager_profielen_updated_at
  BEFORE UPDATE ON zorgvrager_profielen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Blind reveal functie
CREATE OR REPLACE FUNCTION check_blind_reveal()
RETURNS TRIGGER AS $$
DECLARE
  v_ingediend_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ingediend_count
  FROM reviews
  WHERE match_id = NEW.match_id AND status = 'INGEDIEND';

  IF v_ingediend_count >= 2 THEN
    UPDATE reviews SET status = 'ZICHTBAAR'
    WHERE match_id = NEW.match_id AND status = 'INGEDIEND';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS blind_reveal_trigger ON reviews;
CREATE TRIGGER blind_reveal_trigger
  AFTER INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW WHEN (NEW.status = 'INGEDIEND')
  EXECUTE FUNCTION check_blind_reveal();

-- Gemiddelde scores functie
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
    COUNT(*),
    ROUND(AVG((scores->>'professionaliteit')::NUMERIC), 1),
    ROUND(AVG((scores->>'communicatie')::NUMERIC), 1),
    ROUND(AVG((scores->>'punctualiteit')::NUMERIC), 1),
    ROUND(AVG((scores->>'vertrouwen')::NUMERIC), 1),
    ROUND(AVG((
      COALESCE((scores->>'professionaliteit')::NUMERIC, 0) +
      COALESCE((scores->>'communicatie')::NUMERIC, 0) +
      COALESCE((scores->>'punctualiteit')::NUMERIC, 0) +
      COALESCE((scores->>'vertrouwen')::NUMERIC, 0)
    ) / 4), 1)
  FROM reviews
  WHERE reviewee_id = p_zorgverlener_id
    AND reviewer_rol = 'ZORGVRAGER'
    AND status = 'ZICHTBAAR';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE zorgvrager_profielen ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Zorgvrager profielen policies
DROP POLICY IF EXISTS "Zorgvrager ziet eigen profiel" ON zorgvrager_profielen;
CREATE POLICY "Zorgvrager ziet eigen profiel" ON zorgvrager_profielen
  FOR SELECT USING (gebruiker_id = get_current_gebruiker_id());

DROP POLICY IF EXISTS "Beheer ziet alle zorgvrager profielen" ON zorgvrager_profielen;
CREATE POLICY "Beheer ziet alle zorgvrager profielen" ON zorgvrager_profielen
  FOR SELECT USING (get_current_rol() = 'BEHEER');

DROP POLICY IF EXISTS "Zorgverlener ziet profiel bij bevestigde match" ON zorgvrager_profielen;
CREATE POLICY "Zorgverlener ziet profiel bij bevestigde match" ON zorgvrager_profielen
  FOR SELECT USING (
    get_current_rol() = 'ZORGVERLENER'
    AND EXISTS (
      SELECT 1 FROM matches m
      JOIN zorgvragen z ON z.id = m.zorgvraag_id
      WHERE m.zorgverlener_id = get_current_gebruiker_id()
        AND z.zorgvrager_id = zorgvrager_profielen.gebruiker_id
        AND m.status IN ('BEVESTIGD', 'AFGEROND')
    )
  );

DROP POLICY IF EXISTS "Zorgvrager maakt eigen profiel aan" ON zorgvrager_profielen;
CREATE POLICY "Zorgvrager maakt eigen profiel aan" ON zorgvrager_profielen
  FOR INSERT WITH CHECK (
    gebruiker_id = get_current_gebruiker_id()
    AND get_current_rol() = 'ZORGVRAGER'
  );

DROP POLICY IF EXISTS "Zorgvrager werkt eigen profiel bij" ON zorgvrager_profielen;
CREATE POLICY "Zorgvrager werkt eigen profiel bij" ON zorgvrager_profielen
  FOR UPDATE USING (gebruiker_id = get_current_gebruiker_id());

-- Reviews policies
DROP POLICY IF EXISTS "Reviewer ziet eigen review" ON reviews;
CREATE POLICY "Reviewer ziet eigen review" ON reviews
  FOR SELECT USING (reviewer_id = get_current_gebruiker_id());

DROP POLICY IF EXISTS "Reviewee ziet zichtbare review" ON reviews;
CREATE POLICY "Reviewee ziet zichtbare review" ON reviews
  FOR SELECT USING (
    reviewee_id = get_current_gebruiker_id() AND status = 'ZICHTBAAR'
  );

DROP POLICY IF EXISTS "Beheer ziet alle reviews" ON reviews;
CREATE POLICY "Beheer ziet alle reviews" ON reviews
  FOR SELECT USING (get_current_rol() = 'BEHEER');

DROP POLICY IF EXISTS "Beheer beheert alle reviews" ON reviews;
CREATE POLICY "Beheer beheert alle reviews" ON reviews
  FOR UPDATE USING (get_current_rol() = 'BEHEER');

DROP POLICY IF EXISTS "Reviewer dient review in" ON reviews;
CREATE POLICY "Reviewer dient review in" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = get_current_gebruiker_id()
    AND EXISTS (
      SELECT 1 FROM matches m
      JOIN zorgvragen z ON z.id = m.zorgvraag_id
      WHERE m.id = reviews.match_id
        AND m.status = 'AFGEROND'
        AND (m.zorgverlener_id = get_current_gebruiker_id() OR z.zorgvrager_id = get_current_gebruiker_id())
    )
  );

DROP POLICY IF EXISTS "Betrokkene kan review melden" ON reviews;
CREATE POLICY "Betrokkene kan review melden" ON reviews
  FOR UPDATE USING (
    reviewee_id = get_current_gebruiker_id() AND status = 'ZICHTBAAR'
  );
