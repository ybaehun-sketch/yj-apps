import {
  Baby,
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Car,
  CheckSquare,
  Coffee,
  Dog,
  Dumbbell,
  Folder,
  Gamepad2,
  Gift,
  Globe,
  HeartPulse,
  Home,
  Laptop,
  Lightbulb,
  Music,
  Plane,
  Shirt,
  ShoppingBag,
  Star,
  Tag,
  Utensils,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { catIconKey } from "@/lib/notes";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  일정: Calendar,
  쇼핑: ShoppingBag,
  아이디어: Lightbulb,
  공부: BookOpen,
  금융: Wallet,
  맛집: Utensils,
  할일: CheckSquare,
  기타: Folder,
};

export const CUSTOM_ICON_CHOICES: { key: string; Icon: LucideIcon }[] = [
  { key: "book", Icon: BookOpen },
  { key: "briefcase", Icon: Briefcase },
  { key: "baby", Icon: Baby },
  { key: "heart", Icon: HeartPulse },
  { key: "plane", Icon: Plane },
  { key: "dumbbell", Icon: Dumbbell },
  { key: "gamepad", Icon: Gamepad2 },
  { key: "dog", Icon: Dog },
  { key: "music", Icon: Music },
  { key: "home", Icon: Home },
  { key: "car", Icon: Car },
  { key: "coffee", Icon: Coffee },
  { key: "camera", Icon: Camera },
  { key: "gift", Icon: Gift },
  { key: "star", Icon: Star },
  { key: "globe", Icon: Globe },
  { key: "wrench", Icon: Wrench },
  { key: "shirt", Icon: Shirt },
  { key: "laptop", Icon: Laptop },
  { key: "tag", Icon: Tag },
];

const CUSTOM_ICON_MAP: Record<string, LucideIcon> = {
  ...Object.fromEntries(CUSTOM_ICON_CHOICES.map((c) => [c.key, c.Icon])),
  // 기존에 이모지로 저장된 맞춤 카테고리 호환
  "📚": BookOpen,
  "💼": Briefcase,
  "👶": Baby,
  "🏥": HeartPulse,
  "✈️": Plane,
  "🏋️": Dumbbell,
  "🎮": Gamepad2,
  "🐶": Dog,
  "🎵": Music,
  "🏠": Home,
  "🚗": Car,
  "🏷️": Tag,
};

export function CustomIcon({ iconKey, className = "size-4 shrink-0" }: { iconKey: string; className?: string }) {
  const Icon = CUSTOM_ICON_MAP[iconKey] ?? Tag;
  return <Icon className={className} aria-hidden="true" />;
}

export function CategoryIcon({ name, className = "size-3.5 shrink-0" }: { name: string; className?: string }) {
  const customKey = catIconKey(name);
  const Icon = CATEGORY_ICONS[name] ?? (customKey ? CUSTOM_ICON_MAP[customKey] : undefined) ?? Tag;
  return <Icon className={className} aria-hidden="true" />;
}
