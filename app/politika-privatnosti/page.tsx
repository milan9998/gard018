import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PolitikaPrivatnostiPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">Politika privatnosti</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Uvod</h2>
              <p>
                Dobrodošli na sajt Boksarskog i kik boksarskog kluba Gard 018. Poštujemo vašu privatnost i posvećeni smo
                zaštiti vaših ličnih podataka. Ova politika privatnosti objašnjava kako prikupljamo, koristimo i čuvamo
                vaše informacije.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Podaci koje prikupljamo</h2>
              <p>Prikupljamo sledeće podatke:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ime i prezime</li>
                <li>Email adresa</li>
                <li>Datum uplate članarine</li>
                <li>Poruke poslate kroz kontakt formu</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Kako koristimo vaše podatke</h2>
              <p>Vaše podatke koristimo za:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upravljanje članarinama</li>
                <li>Slanje email obaveštenja o isteku članarine</li>
                <li>Komunikaciju sa članovima i potencijalnim članovima</li>
                <li>Poboljšanje kvaliteta naših usluga</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Čuvanje podataka</h2>
              <p>
                Vaši podaci se čuvaju u bezbednoj bazi podataka i dostupni su samo ovlašćenim administratorima kluba.
                Nećemo deliti vaše podatke sa trećim stranama bez vašeg pristanka.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Vaša prava</h2>
              <p>Imate pravo da:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pristupite svojim ličnim podacima</li>
                <li>Izmenite svoje podatke u podešavanjima profila</li>
                <li>Obrišete svoj nalog u bilo kom trenutku</li>
                <li>Zatražite kopiju svih podataka koje čuvamo o vama</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Kolačići (Cookies)</h2>
              <p>
                Koristimo kolačiće za čuvanje vaše sesije nakon prijave. Možete kontrolisati kolačiće kroz podešavanja
                vašeg pretraživača.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Kontakt</h2>
              <p>
                Za pitanja vezana za privatnost, kontaktirajte nas na:{" "}
                <a href="mailto:ognjen.boks19@gmail.com" className="text-primary hover:underline">
                  ognjen.boks19@gmail.com
                </a>
              </p>
            </section>

            <p className="text-sm italic mt-8">Poslednja izmena: {new Date().toLocaleDateString("sr-RS")}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
