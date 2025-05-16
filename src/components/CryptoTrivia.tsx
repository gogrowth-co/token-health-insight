
import { useState, useEffect } from "react";
import { cryptoTrivia, TriviaItem } from "@/data/cryptoTrivia";

export function CryptoTrivia() {
  const [currentTrivia, setCurrentTrivia] = useState<TriviaItem>();
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Function to get a random trivia item
  const getRandomTrivia = () => {
    const randomIndex = Math.floor(Math.random() * cryptoTrivia.length);
    return cryptoTrivia[randomIndex];
  };
  
  // Change trivia every 10 seconds
  useEffect(() => {
    setCurrentTrivia(getRandomTrivia());
    
    const intervalId = setInterval(() => {
      setShowAnswer(false);
      
      // After hiding the answer, wait a moment before changing the question
      setTimeout(() => {
        setCurrentTrivia(getRandomTrivia());
      }, 500);
    }, 10000);
    
    // Show answer after 3 seconds
    const answerId = setTimeout(() => {
      setShowAnswer(true);
    }, 3000);
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(answerId);
    };
  }, []);
  
  if (!currentTrivia) {
    return null;
  }
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 overflow-hidden">
      <h3 className="text-sm font-medium mb-2 text-gray-500">CRYPTO TRIVIA</h3>
      <p className="text-base font-medium mb-4">{currentTrivia.question}</p>
      
      <div className={`transition-opacity duration-500 ${showAnswer ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-sm text-gray-600">{currentTrivia.answer}</p>
      </div>
    </div>
  );
}
