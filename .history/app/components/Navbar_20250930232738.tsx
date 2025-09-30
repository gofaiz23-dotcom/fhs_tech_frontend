"use client";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export default function Test() {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="box"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 100 }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: "purple" }}
          >
            Hello
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
