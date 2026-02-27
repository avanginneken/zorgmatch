# ZorgMatch Platform - MVP Prototype

Een Nederlands zorgkoppelingsplatform dat zorgvragers thuis verbindt met gecertificeerde zzp-zorgverleners in de buurt.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router, Server Components)
- **Database/Auth/Storage**: Supabase (EU West - Frankfurt)
- **Styling**: Tailwind CSS v4
- **Taal**: TypeScript

## Snel starten

### 1. Supabase instellen

1. Maak een account op [supabase.com](https://supabase.com)
2. Maak een nieuw project in de **EU West (Frankfurt)** regio
3. Ga naar **SQL Editor** en voer het schema uit: `supabase/schema.sql`
4. Ga naar **Storage** → maak bucket `documenten` aan (private)

### 2. Environment variables

Vul `.env.local` aan met uw Supabase-gegevens:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 3. Installeren en starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Demo-accounts aanmaken

Ga naar `/aanmelden` en maak accounts aan:
- **Zorgvrager**: kies "Ik zoek zorg"
- **Zorgverlener**: kies "Ik bied zorg aan"
- **Beheer**: na aanmaken, update de rol direct in Supabase:
  ```sql
  UPDATE gebruikers SET rol = 'BEHEER' WHERE email = 'uw@email.nl';
  ```

## Pagina-overzicht

| URL | Beschrijving |
|-----|-------------|
| `/` | Landing page |
| `/aanmelden` | Registratie (zorgvrager of zorgverlener) |
| `/inloggen` | Login |
| `/zorgvrager/dashboard` | Zorgvrager overzicht |
| `/zorgvrager/zorgvraag/nieuw` | Nieuwe zorgaanvraag indienen |
| `/zorgverlener/dashboard` | Zorgverlener overzicht |
| `/zorgverlener/opdrachten` | Beschikbare zorgvragen |
| `/zorgverlener/documenten` | Documenten uploaden |
| `/beheer/dashboard` | Admin overzicht |
| `/beheer/goedkeuring` | ZZP-goedkeuring (handmatig) |
| `/beheer/gebruikers` | Gebruikersoverzicht |
| `/beheer/indicaties` | Tarieven beheren |
| `/beheer/analytics` | Platform statistieken |

## EU Data Compliance (AVG)

| Service | Data locatie | Certificering |
|---------|-------------|---------------|
| PostgreSQL database | Supabase EU West (Frankfurt) | ISO 27001 |
| Authenticatie | Supabase EU West (Frankfurt) | ISO 27001 |
| Bestandsopslag | Supabase Storage EU | ISO 27001 |
| Betalingen (fase 2) | Mollie (Nederland) | PCI DSS |

## Fase 2 - Roadmap

- [ ] Mollie betalingen met automatische commissie-splitsing
- [ ] Push notificaties (Firebase Cloud Messaging / Expo)
- [ ] Kaart-gebaseerde matching met PostGIS
- [ ] Berichten-systeem
- [ ] React Native (Expo) mobiele app voor iOS + Android
- [ ] BigQuery EU analytics pipeline via Segment
- [ ] ISO 27001 / ISO 9001 documentatie
- [ ] Internationale uitbreiding (Belgisch, Duits)
