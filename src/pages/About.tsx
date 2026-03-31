import { motion } from 'motion/react';
import { Palette, ChartColumn, Globe, Users } from 'lucide-react';

const FEATURES = [
  {
    name: 'Beautiful Portfolios',
    description: 'Create stunning, responsive portfolios that look great on any device without writing a single line of code.',
    icon: Palette,
  },
  {
    name: 'Insightful Analytics',
    description: 'Track your profile views, project engagement, and audience demographics with our built-in analytics dashboard.',
    icon: ChartColumn,
  },
  {
    name: 'Custom Domains',
    description: 'Connect your own custom domain to make your portfolio truly yours and stand out to recruiters.',
    icon: Globe,
  },
  {
    name: 'Networking',
    description: 'Connect with peers, alumni, and recruiters in our exclusive academic network.',
    icon: Users,
  },
];

const TEAM = [
  {
    name: 'Alex Rivera',
    role: 'Founder & CEO',
    image: 'https://picsum.photos/seed/alex/400/400',
  },
  {
    name: 'Sarah Chen',
    role: 'Head of Design',
    image: 'https://picsum.photos/seed/sarah/400/400',
  },
  {
    name: 'Marcus Johnson',
    role: 'Lead Engineer',
    image: 'https://picsum.photos/seed/marcus/400/400',
  },
];

export function About() {
  return (
    <main className="flex-1 bg-white dark:bg-[#0F172A] transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
          >
            Empowering the Next Generation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            StudentFolio is the premier platform for students to build, manage, and share their academic and professional achievements with the world.
          </motion.p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-slate-50 dark:bg-[#0B1120] py-24 sm:py-32 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">App Purpose</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Bridging the gap between academia and industry
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              We believe every student deserves a professional online presence. Our platform provides the tools needed to translate academic success into career opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything you need to succeed
            </p>
          </div>
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <motion.div 
                  key={feature.name} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900 dark:text-white">
                    <feature.icon className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-slate-50 dark:bg-[#0B1120] py-24 sm:py-32 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">Team Introduction</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Meet the Team
            </p>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Dedicated professionals working to make your portfolio shine.
            </p>
          </div>
          <ul role="list" className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {TEAM.map((person, index) => (
              <motion.li 
                key={person.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <img className="mx-auto h-48 w-48 rounded-full object-cover shadow-md border-4 border-white dark:border-slate-800" src={person.image} alt={person.name} referrerPolicy="no-referrer" />
                <h3 className="mt-6 text-base font-semibold leading-7 tracking-tight text-slate-900 dark:text-white">{person.name}</h3>
                <p className="text-sm leading-6 text-indigo-600 dark:text-indigo-400">{person.role}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
