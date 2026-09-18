import { motion, type Variants } from 'framer-motion';

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const LINKS = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/tabishaliansari', external: true  },
  { label: 'GitHub',   href: 'https://github.com/tabishaliansari',      external: true  },
  { label: 'Email',    href: 'mailto:ansaritabishali1@gmail.com',      external: false },
  { label: 'YouTube',  href: 'https://youtube.com/@teammavericks-00',   external: true  },
  { label: 'X',        href: 'https://x.com/tabish_ali004',             external: true  },
] as const;

export default function Contact() {
  return (
    <motion.section
      id="contact"
      className="contact"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="contact-container">

        <motion.div className="contact-header" variants={itemVariants}>
          <p className="contact-label">Contact</p>
          <h2 className="contact-title">Get in touch</h2>
          <p className="contact-sub">Open to conversations about health data infrastructure, genomics tooling and research collaboration.</p>
        </motion.div>

        <ul className="contact-list">
          {LINKS.map(({ label, href, external }) => (
            <motion.li key={label} variants={itemVariants}>
              <a
                href={href}
                className="contact-link"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="contact-link-label">{label}</span>
                <span className="contact-link-arrow" aria-hidden="true">→</span>
              </a>
            </motion.li>
          ))}
        </ul>

      </div>
    </motion.section>
  );
}
