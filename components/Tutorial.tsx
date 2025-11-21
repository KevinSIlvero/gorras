import React, { useState } from 'react';
import { X, ChevronRight, MousePointer2, Zap, Settings } from 'lucide-react';

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <MousePointer2 className="w-12 h-12 text-indigo-400" />,
      title: "Bienvenido a Todo Gorra",
      text: "Entrena tu precisión y velocidad de reacción. (Apto para PC y Móvil)",
    },
    {
      icon: <div className="w-12 h-12 rounded-full border-4 border-white bg-white/10 mx-auto" />,
      title: "El Objetivo",
      text: "Haz click o toca los círculos lo más rápido posible. Si fallas, pierdes el combo.",
    },
    {
      icon: <Zap className="w-12 h-12 text-yellow-400" />,
      title: "Combos y Puntos",
      text: "Encadena aciertos para subir el multiplicador. Más rápido = más puntos.",
    },
    {
      icon: <Settings className="w-12 h-12 text-zinc-400" />,
      title: "Personalización",
      text: "Usa el panel de configuración para cambiar la mira, tamaño, velocidad y dificultad.",
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
            <X className="w-6 h-6" />
        </button>

        <div className="text-center py-8">
            <div className="flex justify-center mb-6">
                {steps[step].icon}
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">{steps[step].title}</h2>
            <p className="text-zinc-400 leading-relaxed">{steps[step].text}</p>
        </div>

        <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
                {steps.map((_, i) => (
                    <div 
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    />
                ))}
            </div>
            <button 
                onClick={handleNext}
                className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition"
            >
                {step === steps.length - 1 ? 'Jugar' : 'Siguiente'}
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};