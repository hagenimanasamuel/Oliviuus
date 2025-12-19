import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, Trophy, Zap, Shield, ChevronUp } from 'lucide-react';
import { useTranslation } from "react-i18next";

export default function ProRacingChallenge({ onGameEvent, isFullscreen }) {
  const { t } = useTranslation();
  
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerCar, setPlayerCar] = useState({ x: 150, y: 400, lane: 1, width: 45, height: 80 });
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState(1);
  const [powerUps, setPowerUps] = useState([]);
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [shieldCharges, setShieldCharges] = useState(3);
  const [isShielded, setIsShielded] = useState(false);
  const [shieldCooldown, setShieldCooldown] = useState(false);
 
  const road = { width: 350, height: 500, lanes: 3 };
  const initialSpeed = 2;
  const maxSpeed = 12;
 
  const obstaclesRef = useRef([]);
  const animationRef = useRef(null);
  const lastSpawnTimeRef = useRef(0);
  const lastPowerUpSpawnRef = useRef(0);
  const [gameSpeed, setGameSpeed] = useState(initialSpeed);
  const [invincible, setInvincible] = useState(false);
  const [specialEffects, setSpecialEffects] = useState({
    roadColor: "#222",
    glow: false,
    sparkle: false
  });
  
  const POWER_UP_TYPES = {
    SHIELD_CHARGE: { id: 1, color: "#FFFF00", name: "SHIELD_CHARGE", duration: 0, icon: "🛡️", effect: "shield_charge" },
    SHIELD: { id: 2, color: "#FFFF00", name: "SHIELD", duration: 420, icon: "🛡️", effect: "shield" },
    SLOW: { id: 3, color: "#00FFFF", name: "SLOW", duration: 400, icon: "🐌", effect: "slow" },
    SPEED: { id: 4, color: "#00FF88", name: "SPEED", duration: 300, icon: "⚡", effect: "speed" }
  };
  
  const ENEMY_TYPES = [
    { color: "#3B82F6", darkColor: "#1D4ED8", speed: 0.8, width: 40, height: 70, spawnRate: 0.4 },
    { color: "#EF4444", darkColor: "#DC2626", speed: 1.2, width: 38, height: 65, spawnRate: 0.3 },
    { color: "#10B981", darkColor: "#047857", speed: 0.6, width: 45, height: 75, spawnRate: 0.3 },
  ];

  // Game update logic
  const updateGame = useCallback(() => {
    if (gameState !== "playing") return;
   
    // Update obstacles
    obstaclesRef.current = obstaclesRef.current
      .map(obs => {
        if (obs.parked) return obs;
       
        return {
          ...obs,
          y: obs.y + obs.speed,
          speed: obs.baseSpeed * gameSpeed * (0.8 + Math.random() * 0.4)
        };
      })
      .filter(obs => obs.y < road.height + 100);
   
    // Update power-ups
    setPowerUps(prev => {
      const updated = prev
        .map(pu => ({
          ...pu,
          y: pu.y + gameSpeed
        }))
        .filter(pu => pu.y < road.height + 50);
     
      return updated;
    });
   
    // Check power-up collection
    const playerCenterX = playerCar.x + playerCar.width/2;
    const playerCenterY = playerCar.y + playerCar.height/2;
   
    setPowerUps(prev => {
      const collected = prev.filter(pu => {
        const distance = Math.sqrt(
          Math.pow(playerCenterX - pu.x, 2) +
          Math.pow(playerCenterY - pu.y, 2)
        );
       
        if (distance < 35) {
          const type = POWER_UP_TYPES[pu.type];
          if (!type) return false;
         
          switch(pu.type) {
            case "SHIELD_CHARGE":
              setShieldCharges(prevCharges => Math.min(5, prevCharges + 1));
              setMessage(t('proRacingChallenge.game.powerUps.shieldCharge'));
              setTimeout(() => setMessage(""), 1000);
              break;
            case "SHIELD":
              setInvincible(true);
              setActivePowerUp("SHIELD");
              setPowerUpTimer(POWER_UP_TYPES.SHIELD.duration);
              setMessage(t('proRacingChallenge.game.powerUps.autoShield'));
              setTimeout(() => setMessage(""), 1000);
              break;
            case "SLOW":
              setGameSpeed(prev => Math.max(initialSpeed, prev * 0.7));
              setActivePowerUp("SLOW");
              setPowerUpTimer(POWER_UP_TYPES.SLOW.duration);
              setMessage(t('proRacingChallenge.game.powerUps.slowMotion'));
              setTimeout(() => setMessage(""), 1000);
              break;
            case "SPEED":
              setGameSpeed(prev => Math.min(maxSpeed, prev * 1.3));
              setActivePowerUp("SPEED");
              setPowerUpTimer(POWER_UP_TYPES.SPEED.duration);
              setMessage(t('proRacingChallenge.game.powerUps.speedBoost'));
              setTimeout(() => setMessage(""), 1000);
              break;
          }
         
          return false;
        }
        return true;
      });
     
      return collected;
    });
   
    // Handle power-up timer
    if (activePowerUp && powerUpTimer > 0) {
      setPowerUpTimer(prev => prev - 1);
     
      if (powerUpTimer <= 1) {
        const expiredType = activePowerUp;
        setActivePowerUp(null);
       
        switch(expiredType) {
          case "SHIELD":
            setInvincible(false);
            break;
          case "SLOW":
            setGameSpeed(prev => Math.min(maxSpeed, prev / 0.7));
            break;
          case "SPEED":
            setGameSpeed(prev => Math.max(initialSpeed, prev / 1.3));
            break;
          default:
            break;
        }
      }
    }
   
    // Collision detection
    const playerRect = {
      x: playerCar.x + 5,
      y: playerCar.y + 5,
      width: playerCar.width - 10,
      height: playerCar.height - 10
    };
   
    const collision = obstaclesRef.current.some(obs => {
      if (obs.parked || invincible) return false;
      
      const obsRect = {
        x: obs.x + 5,
        y: obs.y + 5,
        width: obs.width - 10,
        height: obs.height - 10
      };
     
      return (
        playerRect.x < obsRect.x + obsRect.width &&
        playerRect.x + playerRect.width > obsRect.x &&
        playerRect.y < obsRect.y + obsRect.height &&
        playerRect.y + playerRect.height > obsRect.y
      );
    });
   
    if (collision) {
      setGameState("gameOver");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("racingHighScore", score.toString());
      }
      setMessage(t('proRacingChallenge.game.collision.crash'));
    }
   
    // Increase score for survival
    setScore(prev => prev + Math.floor(gameSpeed));
   
    // Level progression
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      setGameSpeed(prev => Math.min(maxSpeed, prev * 1.1));
    }
   
    // Special effects at milestones
    if (score >= 500 && !specialEffects.roadColor) {
      setSpecialEffects(prev => ({ ...prev, roadColor: "#1A1A2E" }));
      setMessage(t('proRacingChallenge.game.powerUps.roadColor'));
      setTimeout(() => setMessage(""), 1500);
    }
    if (score >= 1500 && !specialEffects.glow) {
      setSpecialEffects(prev => ({ ...prev, glow: true }));
      setMessage(t('proRacingChallenge.game.powerUps.roadGlow'));
      setTimeout(() => setMessage(""), 1500);
    }
  }, [gameState, playerCar, activePowerUp, powerUpTimer, shieldCharges, invincible, score, level, gameSpeed, highScore, road.height, specialEffects, initialSpeed, maxSpeed, t]);

  // Shield activation function
  const activateShield = useCallback(() => {
    if (gameState !== "playing" || shieldCooldown || shieldCharges <= 0) return;
   
    // Use one shield charge
    setShieldCharges(prev => prev - 1);
    setIsShielded(true);
    setShieldCooldown(true);
   
    // Activate 7-second shield
    setInvincible(true);
    setActivePowerUp("SHIELD");
    setPowerUpTimer(420); // 7 seconds at 60fps
    
    setMessage(t('proRacingChallenge.game.powerUps.shieldActive'));
   
    // Visual effect ends quickly
    setTimeout(() => {
      setIsShielded(false);
    }, 500);
   
    // Cooldown after activation
    setTimeout(() => {
      setShieldCooldown(false);
    }, 1200);
    
  }, [gameState, shieldCooldown, shieldCharges, t]);

  // Smart obstacle spawning algorithm
  const spawnEnemy = useCallback(() => {
    const laneWidth = road.width / road.lanes;
   
    // Get current traffic density per lane
    const laneDensities = Array(road.lanes).fill(0);
    obstaclesRef.current.forEach(obs => {
      if (obs.y > -100 && obs.y < 200 && !obs.parked) {
        laneDensities[obs.lane] += 1;
      }
    });
   
    // Always ensure at least one lane has space
    const minDensity = Math.min(...laneDensities);
    const availableLanes = laneDensities
      .map((density, index) => density <= minDensity ? index : -1)
      .filter(index => index !== -1);
   
    if (availableLanes.length === 0) return;
   
    // Choose lane with lowest density
    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
   
    // Enforce minimum distance between cars in same lane
    const carsInLane = obstaclesRef.current.filter(obs =>
      obs.lane === lane && obs.y > -100 && !obs.parked
    );
   
    if (carsInLane.length > 0) {
      const lastCar = carsInLane.reduce((prev, curr) =>
        prev.y > curr.y ? prev : curr
      );
     
      // Ensure minimum gap based on level
      const minGap = Math.max(150, 300 - level * 20);
      if (lastCar.y > -minGap) return;
    }
   
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
   
    const newEnemy = {
      id: Date.now() + Math.random(),
      lane,
      x: lane * laneWidth + laneWidth/2 - type.width/2,
      y: -type.height - Math.random() * 50,
      width: type.width,
      height: type.height,
      color: type.color,
      darkColor: type.darkColor,
      speed: type.speed * gameSpeed * (0.8 + Math.random() * 0.4),
      baseSpeed: type.speed,
      parked: false
    };
   
    obstaclesRef.current = [...obstaclesRef.current.filter(o => !o.parked), newEnemy];
  }, [road.lanes, road.width, level, gameSpeed]);

  const spawnPowerUp = useCallback(() => {
    const laneWidth = road.width / road.lanes;
   
    // Find safe lane (no cars nearby)
    const safeLanes = [];
    for (let i = 0; i < road.lanes; i++) {
      const carsNearby = obstaclesRef.current.some(obs =>
        obs.lane === i && obs.y > -50 && obs.y < 150 && !obs.parked
      );
      if (!carsNearby) safeLanes.push(i);
    }
   
    if (safeLanes.length === 0) return;
   
    const lane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
    
    // Earn shield charges based on score: more likely when low + score-based probability
    const scoreBasedChance = Math.min(0.3, score / 10000);
    let type;
    if (shieldCharges < 3 || Math.random() < scoreBasedChance) {
      type = "SHIELD_CHARGE";
    } else if (Math.random() < 0.25) {
      type = "SHIELD";
    } else if (Math.random() < 0.4) {
      type = "SLOW";
    } else {
      type = "SPEED";
    }
   
    const newPowerUp = {
      id: Date.now() + Math.random(),
      lane,
      x: lane * laneWidth + laneWidth/2,
      y: -30,
      type: type,
      width: 22,
      height: 22
    };
   
    setPowerUps(prev => [...prev, newPowerUp]);
  }, [road.lanes, road.width, shieldCharges, score]);

  // Initialize pre-game obstacles
  const initializePreGameObstacles = useCallback(() => {
    const laneWidth = road.width / road.lanes;
    const preGameObstacles = [];
   
    // Create 3-4 parked cars at different lanes and positions
    for (let i = 0; i < 4; i++) {
      const lane = i % road.lanes;
      const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
     
      preGameObstacles.push({
        id: `parked-${i}`,
        lane,
        x: lane * laneWidth + laneWidth/2 - type.width/2,
        y: road.height * (0.3 + 0.15 * i),
        width: type.width,
        height: type.height,
        color: type.color,
        darkColor: type.darkColor,
        speed: 0,
        baseSpeed: 0,
        parked: true
      });
    }
   
    obstaclesRef.current = preGameObstacles;
  }, [road.height, road.lanes, road.width]);

  // Mobile touch controls setup
  const setupTouchControls = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    
    const handleTouchStart = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const touchY = e.touches[0].clientY - rect.top;
     
      // Determine lane based on touch position
      const laneWidth = road.width / road.lanes;
      const touchedLane = Math.floor(touchX / laneWidth);
     
      if (touchedLane >= 0 && touchedLane < road.lanes) {
        const newX = touchedLane * laneWidth + laneWidth/2 - playerCar.width/2;
        setPlayerCar(prev => ({ ...prev, x: newX, lane: touchedLane }));
      }
     
      // Check for vertical movement
      const verticalMove = touchY < road.height * 0.4 ? -20 :
                          touchY > road.height * 0.6 ? 20 : 0;
     
      if (verticalMove !== 0) {
        setPlayerCar(prev => ({
          ...prev,
          y: Math.max(road.height * 0.3,
                     Math.min(road.height - prev.height - 10, prev.y + verticalMove))
        }));
      }
    };
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
   
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [playerCar.width, road.height, road.lanes, road.width]);

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing") return;
   
    const canvas = canvasRef.current;
    if (!canvas) return;
   
    const ctx = canvas.getContext("2d");
   
    const gameLoop = (timestamp) => {
      ctx.clearRect(0, 0, road.width, road.height);
     
      // Draw road with pro gradients
      let roadGradient1 = "#333";
      let roadGradient2 = "#2A2A2A";
     
      if (score >= 500) {
        roadGradient1 = "#16213E";
        roadGradient2 = "#0F3460";
      }
      if (score >= 1500) {
        roadGradient1 = "#522B5B";
        roadGradient2 = "#854F6C";
      }
      const gradient = ctx.createLinearGradient(0, 0, 0, road.height);
      gradient.addColorStop(0, roadGradient1);
      gradient.addColorStop(1, roadGradient2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, road.width, road.height);
     
      ctx.fillStyle = score >= 500 ? "#8B5CF6" : "#444";
      ctx.fillRect(0, 0, 10, road.height);
      ctx.fillRect(road.width - 10, 0, 10, road.height);
     
      ctx.strokeStyle = score >= 1500 ? "#00FFFF" : "#FFFFFF";
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 3;
     
      const offset = (Date.now() / 25) % 40;
      ctx.lineDashOffset = offset;
     
      for (let i = 1; i < road.lanes; i++) {
        const laneX = (road.width / road.lanes) * i;
        ctx.beginPath();
        ctx.moveTo(laneX, 0);
        ctx.lineTo(laneX, road.height);
        ctx.stroke();
      }
     
      ctx.setLineDash([]);
     
      // Draw shield activation effect
      if (isShielded) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.25)";
        ctx.fillRect(0, 0, road.width, road.height);
       
        // Shield particles
        for (let i = 0; i < 15; i++) {
          const x = playerCar.x + playerCar.width/2 + (Math.random() - 0.5) * 40;
          const y = playerCar.y + playerCar.height/2 + (Math.random() - 0.5) * 40;
          ctx.fillStyle = `rgba(255, 255, 0, ${0.8 - Math.random() * 0.4})`;
          ctx.beginPath();
          ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
     
      // Draw obstacles with enhanced details
      obstaclesRef.current.forEach(obs => {
        if (obs.parked) return;
       
        const gradient = ctx.createLinearGradient(
          obs.x, obs.y, obs.x, obs.y + obs.height
        );
        gradient.addColorStop(0, obs.color);
        gradient.addColorStop(1, obs.darkColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // Windows
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(obs.x + 6, obs.y + 8, obs.width - 12, 10);
        ctx.fillRect(obs.x + 6, obs.y + obs.height - 18, obs.width - 12, 10);
        
        // Wheels
        const wheelSize = 4;
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(obs.x + 6, obs.y + 12, wheelSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(obs.x + obs.width - 6, obs.y + 12, wheelSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(obs.x + 6, obs.y + obs.height - 12, wheelSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(obs.x + obs.width - 6, obs.y + obs.height - 12, wheelSize, 0, Math.PI * 2);
        ctx.fill();
      });
     
      // Draw power-ups with glow
      powerUps.forEach(pu => {
        const type = POWER_UP_TYPES[pu.type];
        if (!type) return;
       
        const pulse = Math.sin(Date.now() / 180 + pu.id) * 3;
        const size = 22 + pulse;
       
        // Outer glow
        const glowGradient = ctx.createRadialGradient(pu.x, pu.y, 0, pu.x, pu.y, size/2 + 4);
        glowGradient.addColorStop(0, type.color + "AA");
        glowGradient.addColorStop(1, type.color + "00");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, size/2 + 4, 0, Math.PI * 2);
        ctx.fill();
       
        // Main circle
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, size/2, 0, Math.PI * 2);
        ctx.fill();
       
        // Icon
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(type.icon, pu.x, pu.y);
      });
     
      // Draw player car - PRO ENHANCED
      const { x, y, width, height } = playerCar;
     
      // Car body with advanced gradient
      const carGradient = ctx.createLinearGradient(x, y, x, y + height);
      if (invincible) {
        carGradient.addColorStop(0, "#FFFFFF");
        carGradient.addColorStop(0.3, "#FFFF88");
        carGradient.addColorStop(0.7, "#FFFF00");
        carGradient.addColorStop(1, "#CCCC00");
      } else {
        carGradient.addColorStop(0, "#FF6666");
        carGradient.addColorStop(0.5, "#FF4444");
        carGradient.addColorStop(1, "#CC0000");
      }
      ctx.fillStyle = carGradient;
      ctx.fillRect(x, y, width, height);
     
      // Spoiler
      ctx.fillStyle = invincible ? "#FFFF00" : "#000";
      ctx.fillRect(x + 3, y - 6, width - 6, 4);
     
      // Windows
      ctx.fillStyle = invincible ? "rgba(255,255,255,0.4)" : "rgba(100,150,255,0.4)";
      ctx.fillRect(x + 8, y + 10, width - 16, 12);
      ctx.fillRect(x + 8, y + height - 22, width - 16, 12);
     
      // Headlights
      ctx.fillStyle = "#FFFF99";
      ctx.fillRect(x + 6, y - 3, 10, 6);
      ctx.fillRect(x + width - 16, y - 3, 10, 6);
     
      // Taillights
      ctx.fillStyle = invincible ? "#FFFF00" : "#FF6666";
      ctx.fillRect(x + 6, y + height + 1, 10, 6);
      ctx.fillRect(x + width - 16, y + height + 1, 10, 6);
     
      // Wheels with rims
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(x + 8, y + 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(x + width - 8, y + 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(x + 8, y + height - 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(x + width - 8, y + height - 18, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Wheel rims
      ctx.fillStyle = "#666";
      ctx.beginPath();
      ctx.arc(x + 8, y + 18, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(x + width - 8, y + 18, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(x + 8, y + height - 18, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(x + width - 8, y + height - 18, 3, 0, Math.PI * 2);
      ctx.fill();
     
      // Shield aura during invincibility
      if (invincible) {
        ctx.strokeStyle = "#FFFF00";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#FFFF00";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2, width/2 + 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
     
      // Exhaust with motion blur
      for (let i = 0; i < 5; i++) {
        const ex = x + width / 2 + (Math.random() - 0.5) * 8 + (gameSpeed * 2);
        const ey = y + height + Math.random() * 8;
        const alpha = 0.8 - i * 0.15;
        ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 2 + i * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
     
      // Q indicator
      if (shieldCharges > 0 && !shieldCooldown) {
        ctx.fillStyle = "#FFFF00";
        ctx.shadowColor = "#FFFF00";
        ctx.shadowBlur = 10;
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Q", x + width/2, y - 12);
        ctx.shadowBlur = 0;
      }
     
      // UI - Enhanced
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "left";
      ctx.fillText(t('proRacingChallenge.ui.score', { score: Math.floor(score).toLocaleString() }), 8, 28);
     
      ctx.fillStyle = "#00FF88";
      ctx.fillText(t('proRacingChallenge.ui.level', { level }), road.width - 80, 28);
      
      // Shield charges display
      ctx.textAlign = "left";
      for (let i = 0; i < 5; i++) {
        const shieldX = 12 + i * 26;
        const isActive = i < shieldCharges;
        ctx.fillStyle = isActive ? "#FFFF00" : "#444";
        ctx.font = isActive ? "bold 20px Arial" : "16px Arial";
        ctx.shadowColor = isActive ? "#FFFF00" : "transparent";
        ctx.shadowBlur = isActive ? 8 : 0;
        ctx.fillText("🛡️", shieldX, 48);
        ctx.shadowBlur = 0;
      }
      
      ctx.fillStyle = "#FFFF00";
      ctx.font = "bold 16px Arial";
      ctx.fillText(t('proRacingChallenge.ui.shieldCharges', { charges: shieldCharges }), 135, 48);
     
      // Cooldown indicator
      if (shieldCooldown) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(road.width/2 - 50, 25, 100, 25);
        ctx.fillStyle = "rgba(100,100,100,0.9)";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(t('proRacingChallenge.ui.cooldown'), road.width/2, 42);
      }
     
      // Active power-up timer
      if (activePowerUp && powerUpTimer > 0) {
        const type = POWER_UP_TYPES[activePowerUp];
        if (type) {
          const timeLeft = Math.ceil(powerUpTimer / 60);
          ctx.fillStyle = type.color;
          ctx.shadowColor = type.color;
          ctx.shadowBlur = 10;
          ctx.font = "bold 16px Arial";
          ctx.textAlign = "center";
          ctx.fillText(t('proRacingChallenge.ui.powerUpTimer', { 
            icon: type.icon, 
            time: timeLeft 
          }), road.width/2, 28);
          ctx.shadowBlur = 0;
        }
      }
     
      // Update game state
      updateGame();
     
      // Smart spawning
      if (timestamp - lastSpawnTimeRef.current > (800 / gameSpeed)) {
        const carsOnScreen = obstaclesRef.current.filter(o =>
          !o.parked && o.y > -50 && o.y < road.height
        ).length;
       
        const maxCars = Math.min(8, 3 + Math.floor(level / 1.5));
        if (carsOnScreen < maxCars) {
          spawnEnemy();
        }
        lastSpawnTimeRef.current = timestamp;
      }
     
      if (timestamp - lastPowerUpSpawnRef.current > (4500 + Math.random() * 2000)) {
        if (Math.random() < 0.35) spawnPowerUp();
        lastPowerUpSpawnRef.current = timestamp;
      }
     
      animationRef.current = requestAnimationFrame(gameLoop);
    };
   
    animationRef.current = requestAnimationFrame(gameLoop);
   
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, updateGame, spawnEnemy, spawnPowerUp, level, gameSpeed, road.width, road.height, score, shieldCharges, activePowerUp, powerUpTimer, playerCar, invincible, isShielded, shieldCooldown, t]);

  // Initialize game
  useEffect(() => {
    const savedHighScore = localStorage.getItem("racingHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
   
    initializePreGameObstacles();
   
    const cleanupTouch = setupTouchControls();
    return cleanupTouch;
  }, [initializePreGameObstacles, setupTouchControls]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (gameState !== "playing") {
          startGame();
          return;
        }
      }
     
      // SHIELD ACTIVATION WITH Q KEY
      if ((e.key === "Q" || e.key === "q") && gameState === "playing") {
        e.preventDefault();
        activateShield();
        return;
      }
     
      if (gameState !== "playing") return;
     
      const laneWidth = road.width / road.lanes;
      let newLane = playerCar.lane;
     
      switch(e.key.toLowerCase()) {
        case "arrowleft":
        case "a":
          newLane = Math.max(0, playerCar.lane - 1);
          break;
        case "arrowright":
        case "d":
          newLane = Math.min(road.lanes - 1, playerCar.lane + 1);
          break;
        case "arrowup":
        case "w":
          setPlayerCar(prev => ({
            ...prev,
            y: Math.max(road.height * 0.3, prev.y - 35)
          }));
          return;
        case "arrowdown":
        case "s":
          setPlayerCar(prev => ({
            ...prev,
            y: Math.min(road.height - prev.height - 10, prev.y + 35)
          }));
          return;
        default:
          return;
      }
     
      const newX = newLane * laneWidth + laneWidth/2 - playerCar.width/2;
      setPlayerCar(prev => ({
        ...prev,
        x: newX,
        lane: newLane
      }));
    };
   
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, playerCar, road.lanes, road.width, road.height, activateShield]);

  const startGame = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
   
    // Always start with exactly 3 shield charges
    setShieldCharges(3);
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setGameSpeed(initialSpeed);
    obstaclesRef.current = [];
    setPowerUps([]);
    setActivePowerUp(null);
    setPowerUpTimer(0);
    setInvincible(false);
    setIsShielded(false);
    setShieldCooldown(false);
    setSpecialEffects({
      roadColor: "#222",
      glow: false,
      sparkle: false
    });
   
    const laneWidth = road.width / road.lanes;
    setPlayerCar({
      x: laneWidth + laneWidth/2 - 22.5,
      y: road.height * 0.7,
      lane: 1,
      width: 45,
      height: 80
    });
   
    setMessage("");
   
    lastSpawnTimeRef.current = 0;
    lastPowerUpSpawnRef.current = 0;
   
    // Initialize with parked cars
    setTimeout(() => {
      initializePreGameObstacles();
    }, 100);
  };

  // Mobile shield button handler
  const handleMobileShield = () => {
    activateShield();
  };

  return (
    <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'h-screen' : 'min-h-screen'} p-2 w-full`}>
      <div className="w-full max-w-md bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-2xl p-4 border border-[#FF0000]/40">
        {/* Enhanced Game Header - MOBILE OPTIMIZED */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#FF0000] to-[#FF8800] shadow-lg">
              <span className="text-base">🏎️</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight">
                {t('proRacingChallenge.game.title')}
              </h1>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-300">
                  {t('proRacingChallenge.game.level', { level })}
                </span>
                <span className="text-[#FFFF00] font-bold">🛡️{shieldCharges}</span>
              </div>
            </div>
          </div>
         
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1A1A2E]/50 px-2 py-1 rounded-lg border border-[#FFFF00]/30">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative">
                  <div className={`w-2 h-2 rounded-full ${i < shieldCharges ? 'bg-[#FFFF00] shadow-lg shadow-yellow-500/50' : 'bg-gray-600'}`}></div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-1.5 rounded-lg shadow-lg border border-yellow-400/50">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-black text-sm">
                  {t('proRacingChallenge.game.score', { score: Math.floor(score).toLocaleString() })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Canvas - RESPONSIVE */}
        <div className="flex justify-center mb-3">
          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              width={road.width}
              height={road.height}
              className="w-full max-w-[350px] h-auto border-2 border-gradient-to-r from-[#FF0000] to-[#FF8800] rounded-xl shadow-lg touch-none bg-black/20"
              style={{ 
                touchAction: 'none',
                maxHeight: '60vh',
                aspectRatio: '350/500'
              }}
            />
           
            {gameState !== "playing" && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/95 to-black/100 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm border-2 border-[#FF0000]/30">
                {gameState === "menu" ? (
                  <>
                    <div className="text-4xl mb-2 animate-bounce">🏎️</div>
                    <h2 className="text-xl font-black text-white mb-2 tracking-wide">
                      {t('proRacingChallenge.game.title')}
                    </h2>
                    <p className="text-gray-200 text-sm mb-4 text-center px-4">
                      {t('proRacingChallenge.game.instructions.tapLanes')} • {t('proRacingChallenge.game.instructions.shieldButton')}
                    </p>
                   
                    <div className="bg-gradient-to-r from-[#FFFF00]/20 to-yellow-900/30 p-3 rounded-xl mb-4 border border-[#FFFF00]/40">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-[#FFFF00]" />
                        <div>
                          <h3 className="text-sm font-black text-white">
                            {t('proRacingChallenge.tutorial.title')}
                          </h3>
                          <div className="text-yellow-100 text-xs">
                            {t('proRacingChallenge.tutorial.description')}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-200 space-y-1">
                        <div>{t('proRacingChallenge.tutorial.features.shield')}</div>
                        <div>{t('proRacingChallenge.tutorial.features.collect')}</div>
                      </div>
                    </div>
                   
                    <button
                      onClick={startGame}
                      className="py-3 px-8 text-base rounded-xl bg-gradient-to-r from-[#FF0000] to-[#FF8800] text-white font-black shadow-lg active:scale-95 transition-transform duration-150"
                    >
                      {t('proRacingChallenge.game.startButton')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">🏁</div>
                    <h2 className="text-xl font-black text-white mb-2">
                      {t('proRacingChallenge.game.gameOver.title')}
                    </h2>
                    <p className="text-lg text-gray-200 mb-2">
                      {t('proRacingChallenge.game.score', { score: Math.floor(score).toLocaleString() })}
                    </p>
                    {score > 0 && (
                      <p className={`text-sm mb-4 font-black ${score >= highScore ? 'text-yellow-400 animate-pulse' : 'text-yellow-300'}`}>
                        {score >= highScore 
                          ? t('proRacingChallenge.game.gameOver.newHighScore') 
                          : t('proRacingChallenge.game.gameOver.highScore', { score: Math.floor(highScore).toLocaleString() })
                        }
                      </p>
                    )}
                   
                    <button
                      onClick={startGame}
                      className="py-3 px-8 text-base rounded-xl bg-gradient-to-r from-[#FF0000] to-[#FF8800] text-white font-black shadow-lg active:scale-95 transition-transform duration-150"
                    >
                      {t('proRacingChallenge.game.restartButton')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Messages - MOBILE FRIENDLY */}
        {message && gameState === "playing" && (
          <div className={`rounded-lg p-2 text-center text-sm font-black mb-3 ${
            message.includes("Shield")
              ? 'bg-gradient-to-r from-[#FFFF00]/30 to-yellow-900/30 text-[#FFFF00]'
              : 'bg-gradient-to-r from-[#FF0000]/20 to-[#FF8800]/20 text-yellow-300'
          }`}>
            {message}
          </div>
        )}

        {/* MOBILE CONTROLS - OPTIMIZED FOR TOUCH */}
        {gameState === "playing" && (
          <div className="space-y-2 mb-3">
            {/* Lane Controls - COMPACT */}
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map(lane => (
                <button
                  key={lane}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const laneWidth = road.width / road.lanes;
                    const newX = lane * laneWidth + laneWidth/2 - playerCar.width/2;
                    setPlayerCar(prev => ({ ...prev, x: newX, lane }));
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const laneWidth = road.width / road.lanes;
                    const newX = lane * laneWidth + laneWidth/2 - playerCar.width/2;
                    setPlayerCar(prev => ({ ...prev, x: newX, lane }));
                  }}
                  className={`py-3 rounded-lg text-sm font-bold transition-all duration-150 ${
                    playerCar.lane === lane
                      ? 'bg-gradient-to-r from-[#FF0000]/60 to-[#FF8800]/60 border-2 border-[#FF0000] text-white'
                      : 'bg-[#1A1A2E]/80 border border-gray-600/50 text-gray-300 active:bg-[#FF0000]/30 active:border-[#FF0000]/50'
                  }`}
                >
                  {t('proRacingChallenge.game.controls.lane', { lane: lane + 1 })}
                </button>
              ))}
            </div>
           
            {/* Shield Button - PROMINENT */}
            <button
              onClick={handleMobileShield}
              disabled={shieldCooldown || shieldCharges <= 0}
              className={`w-full py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 transition-all ${
                shieldCooldown || shieldCharges <= 0
                  ? 'bg-gray-800/70 border border-gray-600 text-gray-500'
                  : 'bg-gradient-to-r from-[#FFFF00] to-yellow-600 text-gray-900 border-2 border-yellow-500 active:scale-95 shadow-lg'
              } ${isShielded ? 'animate-pulse' : ''}`}
            >
              <Shield className="w-5 h-5" />
              {t('proRacingChallenge.game.controls.shield', { charges: shieldCharges })}
              {shieldCooldown && (
                <span className="text-xs ml-1">
                  {t('proRacingChallenge.game.controls.shieldCooldown')}
                </span>
              )}
            </button>
           
            {/* Vertical Movement - COMPACT */}
            <div className="grid grid-cols-2 gap-1">
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  setPlayerCar(prev => ({
                    ...prev,
                    y: Math.max(road.height * 0.3, prev.y - 35)
                  }));
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPlayerCar(prev => ({
                    ...prev,
                    y: Math.max(road.height * 0.3, prev.y - 35)
                  }));
                }}
                className="py-3 rounded-lg bg-[#1A1A2E]/80 border border-blue-600/50 text-blue-300 text-sm font-bold active:bg-blue-900/40"
              >
                {t('proRacingChallenge.game.controls.up')}
              </button>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  setPlayerCar(prev => ({
                    ...prev,
                    y: Math.min(road.height - prev.height - 10, prev.y + 35)
                  }));
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPlayerCar(prev => ({
                    ...prev,
                    y: Math.min(road.height - prev.height - 10, prev.y + 35)
                  }));
                }}
                className="py-3 rounded-lg bg-[#1A1A2E]/80 border border-blue-600/50 text-blue-300 text-sm font-bold active:bg-blue-900/40"
              >
                {t('proRacingChallenge.game.controls.down')}
              </button>
            </div>
          </div>
        )}

        {/* Mobile Controls Info - MINIMAL */}
        <div className="mt-3 pt-3 border-t border-[#FF0000]/20">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <div className="flex items-center gap-1">
              <span className="text-[#FFFF00] font-bold">🛡️</span>
              <span>7s Shield</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#FFFF00]">+</span>
              <span>Collect Charges</span>
            </div>
          </div>
         
          {/* Cooldown Indicator */}
          {shieldCooldown && (
            <div className="bg-gray-800/50 p-2 rounded-lg text-center mt-2">
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-spin"></div>
                <span className="font-bold text-yellow-300 text-xs">
                  {t('proRacingChallenge.game.controls.recharging')}
                </span>
              </div>
            </div>
          )}
         
          {/* Touch Hint */}
          <div className="text-center text-xs text-gray-500 mt-2">
            {t('proRacingChallenge.game.instructions.touchHint')}
          </div>
        </div>
      </div>
    </div>
  );
}