import { ArrowRight, Phone, Shield, Target, Users, Trophy } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Disciplina",
    description: "Ne dolaziš samo da vežbaš. Gradiš naviku koja te čini jačim svakog dana.",
  },
  {
    icon: Target,
    title: "Fokus",
    description: "Ostavi stres iza sebe i nauči da svaki pokret uradiš sa sigurnošću.",
  },
  {
    icon: Users,
    title: "Zajednica",
    description: "Treniraj među ljudima koji te guraju napred i raduju se tvom uspehu.",
  },
  {
    icon: Trophy,
    title: "Uspeh",
    description: "Tvoj cilj je naš plan — od prvog treninga do rezultata koji vidiš i osećaš.",
  },
]

export function About() {
  return (
    <section id="o-nama" className="premium-section motion-section py-24 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4 font-medium">O Nama</p>
            <h2
              className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              TRADICIJA ŠAMPIONA
            </h2>
            <div className="w-20 h-1 bg-primary mb-8" />

            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Borilački klub <span className="text-foreground font-semibold">Gard 018</span> osnovan je sa ciljem da
              pruži vrhunske uslove za trening borilačkih veština u Nišu. Naš tim iskusnih trenera posvećen je razvoju
              svakog člana, bez obzira na godine ili prethodno iskustvo.
            </p>

            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Verujemo da borilačke veštine nisu samo sport - one su način života koji gradi karakter, samopouzdanje i
              fizičku snagu. Pridruži se našoj porodici i otkrij svoju unutrašnju snagu.
            </p>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-sm flex items-center justify-center">
                <span className="text-primary font-bold text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                  018
                </span>
              </div>
              <div>
                <p className="text-foreground font-semibold">Pozivni broj Niša</p>
                <p className="text-muted-foreground text-sm">Ponosno predstavljamo naš grad</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[350px] lg:mr-8">
            <div
              className="aspect-[4/5] bg-cover bg-center rounded-2xl"
              style={{
                backgroundImage: `url('/images/zagaleriju6-gigapixel-optimized.jpg')`,
              }}
            />
            <div className="absolute -bottom-8 -left-8 bg-primary p-6 rounded-sm">
              <p className="text-4xl font-bold text-primary-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                2023
              </p>
              <p className="text-primary-foreground/80 text-sm uppercase tracking-wider">Godina osnivanja</p>
            </div>
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.32em]">Tvoj sledeći korak</p>
          <h3 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            VIŠE OD TRENINGA. TVOJA NOVA SNAGA.
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Ne čekaj da budeš spreman. Dođi da zajedno izgradimo verziju tebe na koju ćeš biti ponosan.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {features.map((feature, index) => (
            <div key={index} className="about-feature-card group relative flex min-h-[290px] flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card/40 p-7 text-left">
              <span className="mb-8 block text-sm font-bold tracking-[0.28em] text-primary/80">0{index + 1}</span>
              <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:shadow-[0_10px_28px_rgba(214,179,106,0.2)]">
                <feature.icon className="h-8 w-8 text-primary transition-colors group-hover:text-primary-foreground" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground sm:text-[1.7rem]" style={{ fontFamily: "var(--font-heading)" }}>
                {feature.title}
              </h3>
              <p className="text-base leading-7 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:flex-wrap">
          <p className="w-full text-base font-semibold text-foreground sm:text-lg">Prvi trening počinje jednim klikom.</p>
          <a
            href="tel:+381690105213"
            className="inline-flex items-center rounded-full bg-primary px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-all duration-300 hover:-translate-y-1 hover:bg-primary/90"
          >
            Disciplinuj sebe
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <a
            href="tel:+381690105213"
            className="inline-flex items-center rounded-full border border-primary/40 px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10"
          >
            Upoznaj sebe
            <Phone className="ml-2 h-4 w-4 text-primary" />
          </a>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  )
}
