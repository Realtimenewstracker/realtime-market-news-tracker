import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { markAlertsRead, deleteAlert } from "@/lib/alerts.functions";

export type IpoAlert = {
  id: string;
  subject: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

/** Dating-app style deck of IPO-open alerts: swipe left to dismiss, right to read. */
export function IpoAlertSwipe({ alerts, onOpen }: { alerts: IpoAlert[]; onOpen?: () => void }) {
  const qc = useQueryClient();
  const readFn = useServerFn(markAlertsRead);
  const delFn = useServerFn(deleteAlert);
  const [gone, setGone] = useState<string[]>([]);

  const read = useMutation({
    mutationFn: (id: string) => readFn({ data: { ids: [id] } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deck = alerts.filter((a) => !gone.includes(a.id)).slice(0, 3);
  if (deck.length === 0) return null;

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-1 pb-2">
        IPOs opening — swipe
      </div>
      <div className="relative h-[132px]">
        <AnimatePresence initial={false}>
          {deck
            .map((a, i) => (
              <SwipeCard
                key={a.id}
                a={a}
                depth={i}
                onSwipe={(dir) => {
                  setGone((g) => [...g, a.id]);
                  if (dir === "right") read.mutate(a.id);
                  else remove.mutate(a.id);
                }}
                onOpen={onOpen}
              />
            ))
            .reverse()}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SwipeCard({
  a,
  depth,
  onSwipe,
  onOpen,
}: {
  a: IpoAlert;
  depth: number;
  onSwipe: (dir: "left" | "right") => void;
  onOpen?: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-160, 160], [-10, 10]);
  const readOpacity = useTransform(x, [30, 110], [0, 1]);
  const skipOpacity = useTransform(x, [-110, -30], [1, 0]);

  return (
    <motion.div
      drag={depth === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 - depth * 0.04, y: depth * 8 }}
      exit={{ opacity: 0, x: x.get() >= 0 ? 320 : -320, transition: { duration: 0.22 } }}
      onDragEnd={(_e, info) => {
        if (info.offset.x > 90) onSwipe("right");
        else if (info.offset.x < -90) onSwipe("left");
      }}
      className="absolute inset-x-0 top-0 glass-strong rounded-3xl p-4 select-none touch-pan-y"
    >
      <motion.span
        style={{ opacity: readOpacity }}
        className="absolute top-3 left-3 text-[10px] font-bold tracking-widest bg-bull-tint rounded-full px-2 py-0.5"
      >
        READ
      </motion.span>
      <motion.span
        style={{ opacity: skipOpacity }}
        className="absolute top-3 right-3 text-[10px] font-bold tracking-widest bg-bear-tint rounded-full px-2 py-0.5"
      >
        SKIP
      </motion.span>

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
        <Rocket size={12} className="text-primary" /> {a.subject}
      </div>
      <div className="mt-1.5 font-display text-sm font-semibold text-foreground leading-snug line-clamp-2">
        {a.title}
      </div>
      {a.body && <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{a.body}</div>}
      <Link
        to="/ipo"
        onClick={onOpen}
        className="mt-2 inline-flex glass-chip rounded-full px-3 py-1 text-[11px] font-medium text-foreground"
      >
        Open IPO tracker
      </Link>
    </motion.div>
  );
}
