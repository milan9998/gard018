import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function UsloviKoriscenjaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">Uslovi korišćenja</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Prihvatanje uslova</h2>
              <p>
                Korišćenjem ovog sajta i registracijom u klub Gard 018, prihvatate sledeće uslove korišćenja. Ako se ne
                slažete sa bilo kojim delom ovih uslova, molimo vas da ne koristite ovaj sajt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Registracija i članarina</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Za pristup treninzima potrebna je registracija i plaćena članarina</li>
                <li>Članarina se plaća lično u klubu, ne preko interneta</li>
                <li>Članarina važi mesec dana od datuma uplate</li>
                <li>Sistem automatski šalje obaveštenja o isteku članarine</li>
                <li>Klub zadržava pravo da odbije registraciju bez objašnjenja</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Pravila ponašanja</h2>
              <p>Članovi kluba se obavezuju da će:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Poštovati trenere i druge članove</li>
                <li>Dolaziti na treninge u odgovarajućoj sportskoj opremi</li>
                <li>Čuvati imovinu kluba</li>
                <li>Pratiti upustva trenera tokom treninga</li>
                <li>Obaveštavati klub o zdravstvenim problemima pre treninga</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Odgovornost</h2>
              <p>
                Klub Gard 018 ne odgovara za povrede nastale tokom treninga. Svaki član trenira na sopstvenu odgovornost
                i preporučuje se konsultacija sa lekarom pre početka treninga.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Korišćenje sajta</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Zabranjeno je zloupotrebljavati funkcionalnosti sajta</li>
                <li>Svaki nalog je lični i ne sme se deliti</li>
                <li>Zabranjeno je slanje spam poruka ili uvredljivih sadržaja</li>
                <li>Klub zadržava pravo da suspenduje ili obriše nalog korisnika koji krši pravila</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Rasporedi treninga</h2>
              <p>
                Treninzi se održavaju ponedeljkom, utorkom, četvrtkom i petkom od 20:00. Klub zadržava pravo da promeni
                raspored uz prethodno obaveštenje članova.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Izmene uslova</h2>
              <p>
                Klub Gard 018 zadržava pravo da u bilo kom trenutku izmeni ove uslove korišćenja. Izmene stupaju na
                snagu objavljivanjem na sajtu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Kontakt</h2>
              <p>
                Za pitanja vezana za uslove korišćenja, kontaktirajte nas na:{" "}
                <a href="mailto:ognjen.boks19@gmail.com" className="text-primary hover:underline">
                  ognjen.boks19@gmail.com
                </a>{" "}
                ili pozovite{" "}
                <a href="tel:+381690105213" className="text-primary hover:underline">
                  069 010 5213
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
