-- ============================================================
-- ZorgMatch Platform - Database Schema
-- Supabase PostgreSQL (EU West - Frankfurt)
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE rol AS ENUM ('ZORGVRAGER', 'ZORGVERLENER', 'BEHEER');
CREATE TYPE vraag_status AS ENUM ('OPEN', 'GEKOPPELD', 'AFGEROND', 'GEANNULEERD');
CREATE TYPE match_status AS ENUM ('VOORGESTELD', 'BEVESTIGD', 'AFGEROND');
CREATE TYPE betaling_status AS ENUM ('OPEN', 'BETAALD', 'MISLUKT', 'TERUGBETAALD');
CREATE TYPE document_type AS ENUM ('VOG', 'BIG', 'DIPLOMA', 'KVK', 'OVERIG');
CREATE TYPE document_status AS ENUM ('IN_BEHANDELING', 'GOEDGEKEURD', 'AFGEKEURD');

-- ============================================================
-- GEBRUIKERS (Users)
-- ============================================================

CREATE TABLE gebruikers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Supabase auth.users reference
  email TEXT UNIQUE NOT NULL,
  rol rol NOT NULL,
  naam TEXT NOT NULL,
  telefoon TEXT,
  adres TEXT,
  stad TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  aangemeld_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ZORGVERLENER PROFIELEN
-- ============================================================

CREATE TABLE zorgverlener_profielen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gebruiker_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  big_registratie TEXT,
  kvk_nummer TEXT,
  zorgtypes TEXT[] NOT NULL DEFAULT '{}',
  werkgebied_km INTEGER NOT NULL DEFAULT 10,
  uurtarief DECIMAL(10,2),
  bio TEXT,
  goedgekeurd BOOLEAN NOT NULL DEFAULT false,
  goedgekeurd_op TIMESTAMPTZ,
  goedgekeurd_door UUID REFERENCES gebruikers(id),
  afwijzing_reden TEXT,
  document_status document_status NOT NULL DEFAULT 'IN_BEHANDELING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gebruiker_id)
);

-- ============================================================
-- DOCUMENTEN
-- ============================================================

CREATE TABLE documenten (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gebruiker_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  naam TEXT NOT NULL,
  url TEXT NOT NULL, -- Supabase Storage URL (EU)
  geupload_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geverifieerd BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ZORGVRAGEN
-- ============================================================

CREATE TABLE zorgvragen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zorgvrager_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  zorgtype TEXT NOT NULL,
  omschrijving TEXT NOT NULL,
  indicatiebedrag DECIMAL(10,2) NOT NULL,
  uren_per_week INTEGER,
  startdatum DATE,
  status vraag_status NOT NULL DEFAULT 'OPEN',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  stad TEXT NOT NULL,
  adres TEXT NOT NULL,
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MATCHES
-- ============================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zorgvraag_id UUID NOT NULL REFERENCES zorgvragen(id) ON DELETE CASCADE,
  zorgverlener_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'VOORGESTELD',
  reactie_tekst TEXT,
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bevestigd_op TIMESTAMPTZ,
  UNIQUE(zorgvraag_id, zorgverlener_id)
);

-- ============================================================
-- BETALINGEN
-- ============================================================

CREATE TABLE betalingen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  bedrag DECIMAL(10,2) NOT NULL,
  commissie DECIMAL(10,2) NOT NULL,
  mollie_id TEXT UNIQUE,
  status betaling_status NOT NULL DEFAULT 'OPEN',
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id)
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gebruiker_id UUID REFERENCES gebruikers(id),
  actie TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  ip TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIES
-- ============================================================

CREATE TABLE notificaties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gebruiker_id UUID NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titel TEXT NOT NULL,
  bericht TEXT NOT NULL,
  gelezen BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDICATIE TARIEVEN (beheer)
-- ============================================================

CREATE TABLE indicatie_tarieven (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zorgtype TEXT NOT NULL UNIQUE,
  min_bedrag DECIMAL(10,2) NOT NULL,
  max_bedrag DECIMAL(10,2) NOT NULL,
  standaard_bedrag DECIMAL(10,2) NOT NULL,
  commissie_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  actief BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEFAULT TARIEVEN
-- ============================================================

INSERT INTO indicatie_tarieven (zorgtype, min_bedrag, max_bedrag, standaard_bedrag) VALUES
  ('persoonlijke_verzorging', 20.00, 60.00, 35.00),
  ('verpleging', 30.00, 80.00, 50.00),
  ('begeleiding', 20.00, 55.00, 32.00),
  ('huishoudelijke_hulp', 15.00, 35.00, 22.00),
  ('dagbesteding', 18.00, 45.00, 28.00),
  ('nachtzorg', 40.00, 90.00, 60.00),
  ('respijtzorg', 20.00, 60.00, 35.00),
  ('geestelijke_gezondheidszorg', 35.00, 100.00, 65.00);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_gebruikers_rol ON gebruikers(rol);
CREATE INDEX idx_gebruikers_auth_id ON gebruikers(auth_id);
CREATE INDEX idx_zorgvragen_status ON zorgvragen(status);
CREATE INDEX idx_zorgvragen_zorgvrager ON zorgvragen(zorgvrager_id);
CREATE INDEX idx_zorgvragen_locatie ON zorgvragen(lat, lng);
CREATE INDEX idx_matches_zorgvraag ON matches(zorgvraag_id);
CREATE INDEX idx_matches_zorgverlener ON matches(zorgverlener_id);
CREATE INDEX idx_notificaties_gebruiker ON notificaties(gebruiker_id, gelezen);
CREATE INDEX idx_audit_logs_gebruiker ON audit_logs(gebruiker_id);
CREATE INDEX idx_zorgverlener_profielen_goedgekeurd ON zorgverlener_profielen(goedgekeurd);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE gebruikers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zorgverlener_profielen ENABLE ROW LEVEL SECURITY;
ALTER TABLE documenten ENABLE ROW LEVEL SECURITY;
ALTER TABLE zorgvragen ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE betalingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaties ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's database id
CREATE OR REPLACE FUNCTION get_current_gebruiker_id()
RETURNS UUID AS $$
  SELECT id FROM gebruikers WHERE auth_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_current_rol()
RETURNS rol AS $$
  SELECT rol FROM gebruikers WHERE auth_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Gebruikers policies
CREATE POLICY "Gebruikers kunnen eigen profiel zien" ON gebruikers
  FOR SELECT USING (auth_id = auth.uid() OR get_current_rol() = 'BEHEER');

CREATE POLICY "Gebruikers kunnen eigen profiel bijwerken" ON gebruikers
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Beheer kan alle gebruikers zien" ON gebruikers
  FOR ALL USING (get_current_rol() = 'BEHEER');

-- Zorgverlener profielen policies
CREATE POLICY "Zorgverleners zien eigen profiel" ON zorgverlener_profielen
  FOR SELECT USING (
    gebruiker_id = get_current_gebruiker_id() OR get_current_rol() = 'BEHEER'
  );

CREATE POLICY "Zorgverleners kunnen eigen profiel bijwerken" ON zorgverlener_profielen
  FOR UPDATE USING (gebruiker_id = get_current_gebruiker_id());

-- Zorgvragen policies
CREATE POLICY "Zorgvragers zien eigen vragen" ON zorgvragen
  FOR SELECT USING (
    zorgvrager_id = get_current_gebruiker_id() OR get_current_rol() IN ('BEHEER', 'ZORGVERLENER')
  );

CREATE POLICY "Zorgvragers kunnen nieuwe vraag indienen" ON zorgvragen
  FOR INSERT WITH CHECK (zorgvrager_id = get_current_gebruiker_id());

-- Matches policies
CREATE POLICY "Betrokken partijen zien matches" ON matches
  FOR SELECT USING (
    zorgverlener_id = get_current_gebruiker_id() OR
    EXISTS (
      SELECT 1 FROM zorgvragen z
      WHERE z.id = zorgvraag_id AND z.zorgvrager_id = get_current_gebruiker_id()
    ) OR
    get_current_rol() = 'BEHEER'
  );

-- Notificaties policies
CREATE POLICY "Gebruikers zien eigen notificaties" ON notificaties
  FOR ALL USING (gebruiker_id = get_current_gebruiker_id());

-- Documenten policies
CREATE POLICY "Gebruikers zien eigen documenten" ON documenten
  FOR SELECT USING (gebruiker_id = get_current_gebruiker_id() OR get_current_rol() = 'BEHEER');

CREATE POLICY "Gebruikers uploaden eigen documenten" ON documenten
  FOR INSERT WITH CHECK (gebruiker_id = get_current_gebruiker_id());

-- Audit logs policies (alleen beheer)
CREATE POLICY "Alleen beheer ziet audit logs" ON audit_logs
  FOR SELECT USING (get_current_rol() = 'BEHEER');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gebruikers_updated_at BEFORE UPDATE ON gebruikers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER zorgverlener_profielen_updated_at BEFORE UPDATE ON zorgverlener_profielen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER zorgvragen_updated_at BEFORE UPDATE ON zorgvragen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: notify zorgverleners when new zorgvraag is created
CREATE OR REPLACE FUNCTION notify_zorgverleners_on_new_vraag()
RETURNS TRIGGER AS $$
DECLARE
  zorgverlener RECORD;
  afstand DOUBLE PRECISION;
BEGIN
  -- Find nearby approved zorgverleners who offer the requested care type
  FOR zorgverlener IN
    SELECT g.id, g.naam, zp.werkgebied_km
    FROM gebruikers g
    JOIN zorgverlener_profielen zp ON zp.gebruiker_id = g.id
    WHERE zp.goedgekeurd = true
    AND NEW.zorgtype = ANY(zp.zorgtypes)
    AND g.lat IS NOT NULL
    AND g.lng IS NOT NULL
  LOOP
    -- Calculate approximate distance (simplified, use PostGIS for accuracy)
    afstand := SQRT(
      POWER((zorgverlener.lat - NEW.lat) * 111, 2) +
      POWER((zorgverlener.lng - NEW.lng) * 111 * COS(RADIANS(NEW.lat)), 2)
    );

    -- Only notify if within werkgebied
    IF afstand <= zorgverlener.werkgebied_km THEN
      INSERT INTO notificaties (gebruiker_id, type, titel, bericht, data)
      VALUES (
        zorgverlener.id,
        'NIEUWE_ZORGVRAAG',
        'Nieuwe zorgvraag in uw buurt',
        'Er is een nieuwe ' || NEW.zorgtype || ' aanvraag in ' || NEW.stad,
        jsonb_build_object('zorgvraag_id', NEW.id, 'stad', NEW.stad, 'zorgtype', NEW.zorgtype)
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_on_new_zorgvraag
  AFTER INSERT ON zorgvragen
  FOR EACH ROW EXECUTE FUNCTION notify_zorgverleners_on_new_vraag();
