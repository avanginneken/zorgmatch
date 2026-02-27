-- ============================================================
-- ZorgMatch - Eerste admin gebruiker aanmaken
-- Voer dit uit NADAT schema.sql is uitgevoerd
-- EN nadat de admin zich heeft geregistreerd via /aanmelden
-- ============================================================

-- Stap 1: Controleer of de gebruiker bestaat (vervang het e-mailadres)
SELECT id, email, rol FROM gebruikers WHERE email = 'jouw-email@voorbeeld.nl';

-- Stap 2: Zet de rol naar BEHEER (vervang het e-mailadres)
UPDATE gebruikers
SET rol = 'BEHEER'
WHERE email = 'jouw-email@voorbeeld.nl';

-- Stap 3: Bevestig de wijziging
SELECT id, email, rol, aangemeld_op FROM gebruikers WHERE rol = 'BEHEER';
