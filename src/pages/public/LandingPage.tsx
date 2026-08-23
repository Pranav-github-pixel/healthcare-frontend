import React, { useState, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, Activity, Stethoscope, ShieldCheck, ArrowRight, CheckCircle2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

import heroImg from '@/assets/landing/hero-bg.jpg'
import therapyImg from '@/assets/landing/therapy.jpg'
import abstractImg from '@/assets/landing/abstract-health.jpg'

// --- Components ---
// QNA Item
const QNAItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-border/50 py-6">
      <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between text-left focus:outline-none group">
        <h3 className="text-xl font-bold font-serif group-hover:text-primary transition-colors pr-8">{question}</h3>
        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0 ml-4 group-hover:border-primary transition-colors">
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-muted-foreground leading-relaxed text-lg">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Smooth scroll progress for the curving line
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  const pathLength = useSpring(scrollYProgress, { stiffness: 50, damping: 20, restDelta: 0.001 })

  // Hero 3D Transform
  const { scrollY } = useScroll()
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.85])
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0])
  const heroRotateX = useTransform(scrollY, [0, 600], [0, 15])

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground font-mono selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      
      {/* Curving Scroll Timeline Line */}
      <div className="hidden md:block absolute inset-0 pointer-events-none z-0 flex justify-center overflow-hidden">
        <svg className="w-full max-w-[1400px] h-[110%]" viewBox="0 0 1000 4000" preserveAspectRatio="none">
          <motion.path
            d="M 500,0 
               C 500,400 950,500 950,1000 
               C 950,1300 50,1400 50,1600 
               C 50,2000 950,2100 950,2400 
               C 950,2700 50,2800 50,3000 
               C 50,3300 950,3400 950,3600 
               C 950,3800 500,3900 500,4000"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            style={{ pathLength }}
            className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Heart className="w-5 h-5 fill-secondary text-secondary" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight block">
                HealthCare
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">Services</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login">
              <Button className="rounded-2xl h-10 px-5 gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                Sign In <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          style={{ scale: heroScale, opacity: heroOpacity, rotateX: heroRotateX }}
          className="relative h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden origin-bottom perspective-1000"
        >
          <div className="absolute inset-0 z-[-1]">
             <img src={heroImg} alt="Hero" className="w-full h-full object-cover opacity-20" />
             <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="font-serif text-6xl md:text-8xl font-bold tracking-tighter mb-6 max-w-4xl leading-[1.1]"
          >
            Clarity in your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400 italic font-light">healthcare journey.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-lg md:text-2xl text-muted-foreground max-w-2xl mb-10"
          >
            A continuous, immersive approach to wellness, therapy, and medical consultations.
          </motion.p>
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link to="/login">
              <Button size="lg" className="rounded-[2rem] h-16 px-10 text-lg font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-transform duration-300">
                Begin Experience
              </Button>
            </Link>
          </motion.div>
        </motion.section>

        {/* About Section - Continuous Layout */}
        <section id="about" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Left aligned block */}
            <div className="flex flex-col md:flex-row items-center gap-16 mb-40 relative">
              <motion.div 
                initial={{ opacity: 0, x: -100, rotateY: -20 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1, type: "spring" }}
                className="w-full md:w-1/2 aspect-square rounded-[3rem] overflow-hidden shadow-2xl glass-card border-border/50 relative perspective-1000"
              >
                <img src={abstractImg} alt="Abstract" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
              </motion.div>
              
              <div className="w-full md:w-1/2 md:pl-16">
                <motion.h2 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  className="font-serif text-5xl font-bold mb-6"
                >
                  Beyond traditional care.
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-muted-foreground leading-relaxed"
                >
                  We removed the friction of modern medicine. No crowded waiting rooms, no rushed 5-minute appointments. Just an elegant, continuous relationship with your health.
                </motion.p>
              </div>
            </div>

            {/* Right aligned block (Services Preview) */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16 relative">
              <motion.div 
                initial={{ opacity: 0, x: 100, rotateY: 20 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1, type: "spring" }}
                className="w-full md:w-1/2 aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl glass-card border-border/50 relative perspective-1000"
              >
                <img src={therapyImg} alt="Therapy" className="w-full h-full object-cover" />
              </motion.div>
              
              <div className="w-full md:w-1/2 md:pr-16 text-left md:text-right">
                <motion.h2 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  className="font-serif text-5xl font-bold mb-6"
                >
                  Immersive Therapy.
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-muted-foreground leading-relaxed"
                >
                  Connect with licensed professionals in an environment designed for healing, whether in-person or through our secure digital sanctuary.
                </motion.p>
              </div>
            </div>

          </div>
        </section>

        {/* Services / Feature Section (Large Blocks, No Read More) */}
        <section id="services" className="py-32 bg-card/30 relative">
          <div className="max-w-5xl mx-auto px-6 space-y-32">
            
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl glass-card flex items-center justify-center mb-8 border border-primary/30 shadow-xl">
                <Stethoscope className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-serif text-4xl font-bold mb-6">Expert Consultations</h3>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Our board-certified physicians take the time to deeply understand your medical history, providing tailored diagnostics and continuous preventative care that adapts as you grow.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl glass-card flex items-center justify-center mb-8 border border-emerald-400/30 shadow-xl">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="font-serif text-4xl font-bold mb-6">Digital Prescriptions</h3>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Smart prescription tracking, instant refills, and automated adherence reminders. Your medication schedule is perfectly synchronized with your clinical record.
              </p>
            </motion.div>

          </div>
        </section>

        {/* Q&A Section */}
        <section id="faq" className="py-32 relative">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-serif text-5xl font-bold mb-6">Common Inquiries</h2>
              <p className="text-lg text-muted-foreground">Everything you need to know about the HealthCare experience.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="space-y-2"
            >
              <QNAItem 
                question="How long are typical consultations?" 
                answer="We believe in unrushed care. Every standard consultation is scheduled for a minimum of 30 minutes to ensure all your concerns are heard and addressed comprehensively."
              />
              <QNAItem 
                question="Is therapy included in the platform?" 
                answer="Yes, therapy and mental wellness are core pillars of HealthCare. You can easily schedule sessions with our licensed therapists through the same unified dashboard you use for medical appointments."
              />
              <QNAItem 
                question="How do digital prescriptions work?" 
                answer="When a physician prescribes medication, it instantly appears in your secure dashboard. You will receive smart notifications for dosage times and easy one-click refill requests sent directly to your preferred pharmacy."
              />
              <QNAItem 
                question="Do you accept insurance?" 
                answer="We accept most major insurance networks. You can verify your specific coverage details during the onboarding process within the secure Patient Portal."
              />
            </motion.div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 pt-20 pb-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
            <div className="flex items-center gap-2.5 opacity-50 grayscale">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                <Heart className="w-5 h-5 fill-secondary text-secondary" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight block">
                  HealthCare
                </span>
              </div>
            </div>
            
            <div className="flex gap-8 text-sm text-muted-foreground font-bold">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} HealthCare Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
