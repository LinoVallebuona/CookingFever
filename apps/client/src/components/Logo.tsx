import { motion } from 'framer-motion';
import { BurgerArt, FriesArt, SodaArt } from '../art/food';

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="flex items-end gap-1 [@media(max-height:520px)]:hidden">
        <motion.div animate={{ rotate: [-8, -3, -8] }} transition={{ repeat: Infinity, duration: 2.4 }}>
          <FriesArt size={small ? 32 : 52} />
        </motion.div>
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <BurgerArt size={small ? 70 : 120} stack={{ bun: true, patty: true, toppings: ['cheese', 'lettuce', 'tomato'] }} />
        </motion.div>
        <motion.div animate={{ rotate: [8, 3, 8] }} transition={{ repeat: Infinity, duration: 2.1 }}>
          <SodaArt size={small ? 32 : 50} />
        </motion.div>
      </div>
      <h1 className={`text-outline text-shadow-pop -mt-1 font-bold leading-none text-yellow-300 ${small ? 'text-4xl' : 'text-6xl sm:text-7xl [@media(max-height:520px)]:text-5xl'}`} style={{ WebkitTextStroke: small ? '2px #4a2c1a' : '3px #4a2c1a' }}>
        Sizzle <span className="text-white">Shift</span>
      </h1>
      {!small && <div className="mt-2 rounded-full [@media(max-height:520px)]:mt-1 [@media(max-height:520px)]:text-xs bg-black/25 px-4 py-1 text-sm font-semibold tracking-wide text-white">A free restaurant rush game · no ads · no purchases</div>}
    </div>
  );
}
