
import React from 'react';

interface ScoreboardProps {
  score: number;
  lives: number;
  level: number;
}

const PacmanIcon: React.FC = () => (
    <div className="w-6 h-6 bg-yellow-400 rounded-full clip-pacman-icon">
        <style>{`.clip-pacman-icon { clip-path: polygon(50% 50%, 100% 0, 100% 100%, 50% 50%, 0 100%, 0 0); }`}</style>
    </div>
)

const Scoreboard: React.FC<ScoreboardProps> = ({ score, lives, level }) => {
  return (
    <div className="flex justify-between items-center text-white p-2 text-sm md:text-base mb-2">
      <div>
        <span>SCORE: </span>
        <span className="text-yellow-400">{score}</span>
      </div>
      <div>
        <span>LEVEL: </span>
        <span className="text-yellow-400">{level}</span>
      </div>
      <div className="flex items-center">
        <span>LIVES: </span>
        <div className="flex ml-2">
          {Array.from({ length: lives > 0 ? lives - 1 : 0 }).map((_, i) => (
            <div key={i} className="mr-1">
                <PacmanIcon />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
