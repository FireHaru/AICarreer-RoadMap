import {
  Atom, Bot, BrainCircuit, Briefcase, ChartScatter, CodeXml, Cpu, Database, Eye, FlaskConical, Languages,
  MessagesSquare, Microchip, Orbit, RadioTower, Router, ScanEye, Sigma, Sparkles, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'brain-circuit': BrainCircuit,
  cpu: Cpu,
  'chart-scatter': ChartScatter,
  'code-xml': CodeXml,
  'scan-eye': ScanEye,
  'messages-square': MessagesSquare,
  microchip: Microchip,
  router: Router,
  sigma: Sigma,
  sparkles: Sparkles,
  eye: Eye,
  languages: Languages,
  bot: Bot,
  database: Database,
  atom: Atom,
  'radio-tower': RadioTower,
  orbit: Orbit,
  'flask-conical': FlaskConical,
};

export function DomainIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Briefcase;
  return <Icon className={className} aria-hidden />;
}
