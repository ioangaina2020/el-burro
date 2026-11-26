EL BURRO – TASK MANAGER ONLINE
===============================

Această arhivă conține prima versiune pregătită pentru publicare pe Vercel + Supabase.
Aplicația nu este încă publicată și nu are încă o bază de date conectată. Pentru asta
trebuie create conturile tale în Vercel și Supabase și completate setările de conectare.

FUNCȚII
-------
- Administrator: adaugă/editează/șterge membri, grade, status săptămânal,
  bifează taskul și plata, modifică valoarea taskului.
- Vizitator: poate doar vedea lista, taskurile și plățile.
- Grade: Vice President, Treasurer, Sergent, Enforcer, Road Captain, Membru, Prospect.
- Status săptămânal: Activ, Scutit, Inactivitate.
- Valoare inițială: 740.000 $.
- Istoric separat pentru fiecare săptămână.
- Baza de date aplică permisiunile; ascunderea butoanelor nu este singura protecție.

PASUL 1 – CREARE CONTURI
-----------------------
1. Creează un cont gratuit pe https://supabase.com/
2. Creează un cont pe https://vercel.com/
3. În Supabase creează un proiect nou. Salvează parola bazei de date într-un loc sigur.
4. În Project Settings > API copiază Project URL și cheia anon/publicable (NU service_role).

PASUL 2 – CONFIGURARE BAZĂ DE DATE
---------------------------------
1. În Supabase deschide SQL Editor > New query.
2. Deschide fișierul supabase-schema.sql din această arhivă.
3. Copiază tot conținutul în SQL Editor și apasă Run.

PASUL 3 – CONFIGURARE CONTURI
-----------------------------
1. În Supabase > Authentication > Users creează contul tău cu e-mail și parolă.
2. Creează un al doilea cont pentru toți ceilalți, cu e-mailul comun pe care îl vei comunica
   membrilor și parola comună de vizualizare. Nu folosi parola contului tău.
3. În SQL Editor rulează comanda de mai jos, înlocuind adresa cu e-mailul tău:

   update public.profiles set role='admin'
   where id=(select id from auth.users where email='ADRESA_TA');

   Contul comun rămâne cu rolul viewer.

PASUL 4 – LEGARE APLICAȚIE LA SUPABASE
-------------------------------------
1. În app.js înlocuiește:
   PASTE_SUPABASE_PROJECT_URL_HERE
   cu Project URL.
2. Înlocuiește:
   PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE
   cu cheia anon/publicable din Supabase.
3. NU introduce niciodată cheia service_role în aplicația din browser.

PASUL 5 – PUBLICARE PE VERCEL
-----------------------------
1. Creează un repository nou pe GitHub și încarcă fișierele:
   index.html, style.css, app.js.
   (supabase-schema.sql și README-RO.txt pot rămâne în proiect sau local.)
2. În Vercel apasă Add New > Project și importă repository-ul.
3. Framework Preset: Other. Build Command: lasă gol. Output Directory: . (sau root).
4. Apasă Deploy.
5. În Vercel > Project Settings > Domains poți încerca numele el-burro.vercel.app.
   Domeniul este disponibil doar dacă nu este deja folosit.

IMPORTANT – PAROLA COMUNĂ
-------------------------
În versiunea aceasta, utilizatorii folosesc același cont Supabase de tip viewer
(e-mail comun + parolă comună). Administratorul are cont separat. Pentru securitate,
nu distribui contul administratorului. Oricine are parola comună poate vedea datele,
deci comunic-o doar persoanelor cărora vrei să le permiți accesul.

NOTE
----
- Aplicația necesită conexiune la internet.
- Datele sunt sincronizate prin Supabase.
- Nu publica cheia service_role.
- Activează confirmarea e-mailului sau folosește parole puternice.
- Pentru schimbări de structură sau acces, verifică politicile RLS din Supabase.
