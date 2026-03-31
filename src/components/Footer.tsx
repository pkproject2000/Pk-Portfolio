import { Github, Twitter, Linkedin, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                StudentFolio
              </span>
            </Link>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400 max-w-xs">
              Empowering students to showcase their academic journey, projects, and skills to the world.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                <span className="sr-only">GitHub</span>
                <Github className="h-6 w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">Platform</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link to="/explore" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Explore Portfolios
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">Resources</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Guides
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      API Status
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link to="/about" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      About
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm leading-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} StudentFolio, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
