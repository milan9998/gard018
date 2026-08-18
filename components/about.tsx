import { Shield, Target, Users, Trophy } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Disciplina",
    description: "Izgradnja mentalne snage i discipline kroz intenzivne treninge",
  },
  {
    icon: Target,
    title: "Fokus",
    description: "Razvoj koncentracije i preciznosti u svakom pokretu",
  },
  {
    icon: Users,
    title: "Zajednica",
    description: "Deo porodice koja se međusobno podržava i motiviše",
  },
  {
    icon: Trophy,
    title: "Uspeh",
    description: "Put do ličnih i takmičarskih uspeha uz stručno vođenje",
  },
]

export function About() {
  return (
    <section id="o-nama" className="py-24 relative">
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

          <div className="relative">
            <div
              className="aspect-[4/5] bg-cover bg-center rounded-sm"
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-24">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-sm flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                <feature.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  )
}
