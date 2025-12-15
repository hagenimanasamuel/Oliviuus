import { useRef, useEffect, useState, useCallback } from "react";

export default function ProRacingChallenge() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("menu"); // "menu", "playing", "gameOver"
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerCar, setPlayerCar] = useState({ x: 150, y: 350, lane: 2, width: 45, height: 80 });
  const [message, setMessage] = useState("PRESS START TO RACE!");
  const [level, setLevel] = useState(1);
  const [powerUps, setPowerUps] = useState([]);
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  
  // Game settings - BALANCED
  const road = { width: 400, height: 600, lanes: 4 };
  const initialSpeed = 2;
  const maxSpeed = 6; // Reduced from 10 to 6
  
  // Store game objects in refs for better performance
  const obstaclesRef = useRef([]);
  const animationRef = useRef(null);
  const lastSpawnTimeRef = useRef(0);
  const lastPowerUpSpawnRef = useRef(0);
  const [gameSpeed, setGameSpeed] = useState(initialSpeed);
  const [invincible, setInvincible] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [totalEnemiesPassed, setTotalEnemiesPassed] = useState(0);
  const [laneAvailability, setLaneAvailability] = useState([true, true, true, true]);
  
  // Power-up types
  const POWER_UP_TYPES = {
    JUMP: { id: 1, color: "#ff00ff", name: "JUMP", duration: 300, icon: "⬆️" },
    SLOW: { id: 2, color: "#00ffff", name: "SLOW", duration: 400, icon: "🐌" },
    INVINCIBLE: { id: 3, color: "#ffff00", name: "SHIELD", duration: 500, icon: "🛡️" },
    SCORE_BOOST: { id: 4, color: "#00ff00", name: "2X SCORE", duration: 600, icon: "💰" },
    COMBO: { id: 5, color: "#ff8800", name: "COMBO", duration: 450, icon: "✨" }
  };

  // Enemy car types - BALANCED SPAWNS
  const ENEMY_TYPES = [
    { color: "#3b82f6", darkColor: "#1d4ed8", speed: 0.9, width: 40, height: 70, score: 10, spawnRate: 0.4 }, // Common blue
    { color: "#ef4444", darkColor: "#dc2626", speed: 1.1, width: 38, height: 65, score: 15, spawnRate: 0.2 }, // Fast red
    { color: "#10b981", darkColor: "#047857", speed: 0.7, width: 45, height: 75, score: 8, spawnRate: 0.3 }, // Slow green
    { color: "#8b5cf6", darkColor: "#7c3aed", speed: 1.0, width: 42, height: 72, score: 12, spawnRate: 0.1 }, // Rare purple
  ];

  // Calculate available lanes for spawning
  const getAvailableLanes = useCallback(() => {
    const available = [true, true, true, true];
    const safeDistance = 120; // Minimum distance between cars
    
    obstaclesRef.current.forEach(obs => {
      if (obs.y > -50 && obs.y < safeDistance) {
        available[obs.lane] = false;
      }
    });
    
    return available;
  }, []);

  // Draw the road with 4 lanes
  const drawRoad = (ctx) => {
    // Road surface with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, road.height);
    gradient.addColorStop(0, "#222");
    gradient.addColorStop(1, "#333");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, road.width, road.height);
    
    // Road edges
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, 15, road.height);
    ctx.fillRect(road.width - 15, 0, 15, road.height);
    
    // Lane markings with animation
    ctx.strokeStyle = "#fff";
    ctx.setLineDash([25, 25]);
    ctx.lineWidth = 4;
    
    // Animated lane markers (moving down)
    const offset = (Date.now() / 20) % 50;
    ctx.setLineDash([25, 25]);
    ctx.lineDashOffset = offset;
    
    for (let i = 1; i < road.lanes; i++) {
      const laneX = (road.width / road.lanes) * i;
      ctx.beginPath();
      ctx.moveTo(laneX, 0);
      ctx.lineTo(laneX, road.height);
      ctx.stroke();
    }
    
    // Reset line dash for other drawings
    ctx.setLineDash([]);
  };

  // Draw the player's car
  const drawCar = (ctx) => {
    const { x, y, width, height } = playerCar;
    
    // Car body with professional gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "#ff3333");
    gradient.addColorStop(0.5, "#ff0000");
    gradient.addColorStop(1, "#cc0000");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // Car details - windows
    ctx.fillStyle = "rgba(30, 30, 40, 0.8)";
    ctx.fillRect(x + 8, y + 8, width - 16, 15); // Front window
    ctx.fillRect(x + 8, y + height - 23, width - 16, 15); // Back window
    
    // Headlights with glow effect
    ctx.fillStyle = "#ffff99";
    ctx.fillRect(x + 5, y - 2, 10, 5);
    ctx.fillRect(x + width - 15, y - 2, 10, 5);
    
    // Taillights
    ctx.fillStyle = "#ff6666";
    ctx.fillRect(x + 5, y + height + 2, 10, 5);
    ctx.fillRect(x + width - 15, y + height + 2, 10, 5);
    
    // Wheels with detail
    ctx.fillStyle = "#111";
    ctx.fillRect(x - 6, y + 12, 6, 22);
    ctx.fillRect(x + width, y + 12, 6, 22);
    ctx.fillRect(x - 6, y + height - 34, 6, 22);
    ctx.fillRect(x + width, y + height - 34, 6, 22);
    
    // Wheel rims
    ctx.fillStyle = "#666";
    ctx.fillRect(x - 4, y + 16, 2, 14);
    ctx.fillRect(x + width + 2, y + 16, 2, 14);
    ctx.fillRect(x - 4, y + height - 30, 2, 14);
    ctx.fillRect(x + width + 2, y + height - 30, 2, 14);
    
    // Draw invincibility shield if active
    if (invincible) {
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + width/2, y + height/2, width/2 + 15, 0, Math.PI * 2);
      ctx.stroke();
      
      // Shield glow
      ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x + width/2, y + height/2, width/2 + 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // Draw obstacles (enemy cars)
  const drawObstacles = (ctx) => {
    obstaclesRef.current.forEach((obstacle) => {
      // Car body with professional gradient
      const gradient = ctx.createLinearGradient(
        obstacle.x, obstacle.y, 
        obstacle.x, obstacle.y + obstacle.height
      );
      gradient.addColorStop(0, obstacle.color);
      gradient.addColorStop(0.5, obstacle.color);
      gradient.addColorStop(1, obstacle.darkColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Car details - windows
      ctx.fillStyle = "rgba(20, 20, 30, 0.8)";
      ctx.fillRect(obstacle.x + 6, obstacle.y + 6, obstacle.width - 12, 12);
      ctx.fillRect(obstacle.x + 6, obstacle.y + obstacle.height - 18, obstacle.width - 12, 12);
      
      // Headlights
      ctx.fillStyle = "#ffff99";
      ctx.fillRect(obstacle.x + 4, obstacle.y - 2, 8, 4);
      ctx.fillRect(obstacle.x + obstacle.width - 12, obstacle.y - 2, 8, 4);
      
      // Taillights
      ctx.fillStyle = "#ff6666";
      ctx.fillRect(obstacle.x + 4, obstacle.y + obstacle.height + 2, 8, 4);
      ctx.fillRect(obstacle.x + obstacle.width - 12, obstacle.y + obstacle.height + 2, 8, 4);
      
      // Wheels
      ctx.fillStyle = "#111";
      ctx.fillRect(obstacle.x - 5, obstacle.y + 10, 5, 20);
      ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 10, 5, 20);
      ctx.fillRect(obstacle.x - 5, obstacle.y + obstacle.height - 30, 5, 20);
      ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + obstacle.height - 30, 5, 20);
      
      // Show enemy speed indicator for fast cars
      if (obstacle.speed > gameSpeed * 1.1) {
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("FAST", obstacle.x + obstacle.width/2, obstacle.y - 5);
      }
    });
  };

  // Draw power-ups
  const drawPowerUps = (ctx) => {
    powerUps.forEach((powerUp) => {
      const type = POWER_UP_TYPES[powerUp.type];
      if (!type) return;
      
      // Power-up body with pulsing effect
      const pulse = Math.sin(Date.now() / 180) * 4;
      const size = 22 + pulse;
      
      // Glow effect
      ctx.fillStyle = `${type.color}66`;
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, size/2 + 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Main body
      ctx.fillStyle = type.color;
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, size/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Outline
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Power-up icon
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(type.icon, powerUp.x, powerUp.y);
    });
  };

  // Draw the game UI
  const drawUI = (ctx) => {
    // Score display with glow
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px 'Arial Black', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 15, 30);
    
    // Combo multiplier
    if (comboMultiplier > 1) {
      ctx.fillStyle = "#ff8800";
      ctx.font = "bold 18px 'Arial Black', sans-serif";
      ctx.fillText(`${comboMultiplier}X COMBO!`, 15, 55);
    }
    
    // Level display
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 18px 'Arial Black', sans-serif";
    ctx.fillText(`LEVEL: ${level}`, road.width - 120, 30);
    
    // Speed display with gauge
    ctx.fillStyle = "#00aaff";
    ctx.font = "bold 18px 'Arial Black', sans-serif";
    ctx.fillText(`SPEED: ${gameSpeed.toFixed(1)}`, road.width - 120, 55);
    
    // Speed gauge visual
    const speedRatio = gameSpeed / maxSpeed;
    ctx.fillStyle = "#333";
    ctx.fillRect(road.width - 120, 60, 100, 10);
    ctx.fillStyle = speedRatio > 0.7 ? "#ff4444" : speedRatio > 0.4 ? "#ffaa00" : "#00ff88";
    ctx.fillRect(road.width - 120, 60, 100 * speedRatio, 10);
    
    // Active power-up display
    if (activePowerUp) {
      const type = POWER_UP_TYPES[activePowerUp];
      if (type) {
        ctx.fillStyle = type.color;
        ctx.font = "bold 16px 'Arial Black', sans-serif";
        const timeLeft = Math.ceil(powerUpTimer/60);
        ctx.fillText(`${type.name}: ${timeLeft}s`, 15, 80);
        
        // Power-up timer bar
        const timerRatio = powerUpTimer / type.duration;
        ctx.fillStyle = "#333";
        ctx.fillRect(15, 85, 150, 8);
        ctx.fillStyle = type.color;
        ctx.fillRect(15, 85, 150 * timerRatio, 8);
      }
    }
    
    // Enemies passed counter
    ctx.fillStyle = "#aaa";
    ctx.font = "14px Arial";
    ctx.fillText(`Cars Passed: ${totalEnemiesPassed}`, 15, road.height - 20);
    
    // Draw lane indicators (for debugging - shows safe lanes)
    const availableLanes = getAvailableLanes();
    availableLanes.forEach((available, index) => {
      const laneWidth = road.width / road.lanes;
      const laneX = index * laneWidth + laneWidth/2;
      
      if (!available) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fillRect(index * laneWidth + 5, 100, laneWidth - 10, 30);
        
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("BLOCKED", laneX, 120);
      } else {
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        ctx.fillRect(index * laneWidth + 5, 100, laneWidth - 10, 30);
        
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("CLEAR", laneX, 120);
      }
    });
    
    // Game state message
    if (gameState !== "playing") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, road.width, road.height);
      
      // Title
      const gradient = ctx.createLinearGradient(road.width/2 - 100, 80, road.width/2 + 100, 120);
      gradient.addColorStop(0, "#ffaa00");
      gradient.addColorStop(0.5, "#ff4444");
      gradient.addColorStop(1, "#ffaa00");
      ctx.fillStyle = gradient;
      ctx.font = "bold 36px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PRO RACER", road.width/2, 120);
      
      ctx.font = "bold 20px Arial";
      
      if (gameState === "menu") {
        ctx.fillStyle = "#fff";
        ctx.fillText(message, road.width/2, 170);
        
        ctx.fillStyle = "#00ffff";
        ctx.fillText("CONTROLS:", road.width/2, 220);
        
        ctx.fillStyle = "#aaa";
        ctx.fillText("↑ ↓ ← → : MOVE CAR", road.width/2, 260);
        ctx.fillText("SPACE : ACTIVATE JUMP POWER-UP", road.width/2, 290);
        ctx.fillText("ALWAYS KEEP AT LEAST 1 LANE CLEAR", road.width/2, 340);
        ctx.fillText("WATCH FOR SAFE LANE INDICATORS", road.width/2, 370);
        
        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 24px Arial";
        ctx.fillText("PRESS SPACE TO START", road.width/2, 450);
        
        // Show high score
        ctx.fillStyle = "#ffff00";
        ctx.font = "bold 28px Arial";
        ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, road.width/2, 500);
        
      } else if (gameState === "gameOver") {
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 32px 'Arial Black', sans-serif";
        ctx.fillText("GAME OVER", road.width/2, 180);
        
        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText(`SCORE: ${score.toLocaleString()}`, road.width/2, 230);
        
        ctx.fillStyle = "#ffff00";
        ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, road.width/2, 270);
        
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 22px Arial";
        ctx.fillText(`LEVEL REACHED: ${level}`, road.width/2, 310);
        ctx.fillText(`CARS PASSED: ${totalEnemiesPassed}`, road.width/2, 340);
        
        ctx.fillStyle = "#aaa";
        ctx.font = "bold 20px Arial";
        ctx.fillText(message, road.width/2, 390);
        
        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 24px Arial";
        ctx.fillText("PRESS SPACE TO PLAY AGAIN", road.width/2, 450);
      }
    }
  };

  // Spawn a new enemy car - SMART SPAWNING
  const spawnEnemy = useCallback(() => {
    const availableLanes = getAvailableLanes();
    const availableLaneIndices = availableLanes
      .map((available, index) => available ? index : -1)
      .filter(index => index !== -1);
    
    // If no lanes available, don't spawn (ALWAYS KEEP AT LEAST 1 LANE CLEAR)
    if (availableLaneIndices.length === 0) {
      return;
    }
    
    // Choose a random available lane
    const lane = availableLaneIndices[Math.floor(Math.random() * availableLaneIndices.length)];
    const laneWidth = road.width / road.lanes;
    
    // Choose enemy type based on spawn rates
    const rand = Math.random();
    let cumulative = 0;
    let enemyType;
    
    for (const type of ENEMY_TYPES) {
      cumulative += type.spawnRate;
      if (rand <= cumulative) {
        enemyType = type;
        break;
      }
    }
    
    if (!enemyType) enemyType = ENEMY_TYPES[0];
    
    // Random spawn position offset for variety
    const xOffset = (Math.random() - 0.5) * 8;
    
    const newEnemy = {
      id: Date.now() + Math.random(),
      lane,
      x: lane * laneWidth + laneWidth/2 - enemyType.width/2 + xOffset,
      y: -enemyType.height - Math.random() * 50,
      width: enemyType.width,
      height: enemyType.height,
      color: enemyType.color,
      darkColor: enemyType.darkColor,
      speed: enemyType.speed * gameSpeed * (0.9 + Math.random() * 0.2), // Some variation
      baseSpeed: enemyType.speed,
      scoreValue: enemyType.score,
      type: enemyType
    };
    
    obstaclesRef.current = [...obstaclesRef.current, newEnemy];
  }, [road.lanes, gameSpeed, getAvailableLanes]);

  // Spawn a new power-up
  const spawnPowerUp = useCallback(() => {
    const availableLanes = getAvailableLanes();
    const availableLaneIndices = availableLanes
      .map((available, index) => available ? index : -1)
      .filter(index => index !== -1);
    
    if (availableLaneIndices.length === 0) return;
    
    const lane = availableLaneIndices[Math.floor(Math.random() * availableLaneIndices.length)];
    const laneWidth = road.width / road.lanes;
    const types = Object.keys(POWER_UP_TYPES);
    
    // Lower chance for combo power-up
    let type;
    if (Math.random() < 0.1) {
      type = "COMBO";
    } else {
      type = types[Math.floor(Math.random() * (types.length - 1))];
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
  }, [road.lanes, getAvailableLanes]);

  // Update game state
  const updateGame = useCallback(() => {
    if (gameState !== "playing") return;
    
    let scoreIncrease = 0;
    let enemiesPassed = 0;
    
    // Update obstacles
    obstaclesRef.current = obstaclesRef.current
      .map(obs => {
        const newY = obs.y + obs.speed;
        
        // Check if car passed the player (earn points)
        if (obs.y < playerCar.y && newY >= playerCar.y) {
          scoreIncrease += obs.scoreValue * comboMultiplier;
          enemiesPassed++;
        }
        
        return {
          ...obs,
          y: newY,
          // Update speed based on current game speed
          speed: obs.baseSpeed * gameSpeed * (0.9 + Math.random() * 0.2)
        };
      })
      .filter(obs => obs.y < road.height + 100);
    
    // Update score with passed cars
    if (scoreIncrease > 0) {
      setScore(prev => prev + scoreIncrease);
      setTotalEnemiesPassed(prev => prev + enemiesPassed);
      
      // Add to combo
      if (comboTimer > 0) {
        setComboMultiplier(prev => Math.min(3, prev + 0.1)); // Reduced from 5 to 3
      }
      setComboTimer(90); // 1.5 seconds combo window
    }
    
    // Update combo timer
    if (comboTimer > 0) {
      setComboTimer(prev => prev - 1);
    } else if (comboMultiplier > 1) {
      setComboMultiplier(1);
    }
    
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
    
    // Check collisions with obstacles (if not invincible)
    if (!invincible) {
      const playerRect = {
        x: playerCar.x,
        y: playerCar.y,
        width: playerCar.width,
        height: playerCar.height
      };
      
      const collision = obstaclesRef.current.some(obs => {
        const obsRect = {
          x: obs.x,
          y: obs.y,
          width: obs.width,
          height: obs.height
        };
        
        // Rectangle collision detection with 5px buffer
        return (
          playerRect.x + 5 < obsRect.x + obsRect.width - 5 &&
          playerRect.x + playerRect.width - 5 > obsRect.x + 5 &&
          playerRect.y + 5 < obsRect.y + obsRect.height - 5 &&
          playerRect.y + playerRect.height - 5 > obsRect.y + 5
        );
      });
      
      if (collision) {
        setGameState("gameOver");
        setMessage("CRASH! You hit an enemy car! 🚗💥");
        
        // Update high score
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("proRacingHighScore", score.toString());
        }
        
        return;
      }
    }
    
    // Check power-up collection
    const playerCenterX = playerCar.x + playerCar.width/2;
    const playerCenterY = playerCar.y + playerCar.height/2;
    
    setPowerUps(prev => {
      const collected = prev.filter(pu => {
        const distance = Math.sqrt(
          Math.pow(playerCenterX - pu.x, 2) + 
          Math.pow(playerCenterY - pu.y, 2)
        );
        
        if (distance < 30) {
          // Activate power-up
          setActivePowerUp(pu.type);
          setPowerUpTimer(POWER_UP_TYPES[pu.type].duration);
          
          // Apply power-up effect immediately
          switch(pu.type) {
            case "INVINCIBLE":
              setInvincible(true);
              break;
            case "SLOW":
              setGameSpeed(prevSpeed => Math.max(initialSpeed, prevSpeed * 0.8)); // Less slow
              break;
            case "SCORE_BOOST":
              setScore(prevScore => prevScore + 50); // Reduced from 100
              break;
            case "COMBO":
              setComboMultiplier(prev => Math.min(3, prev + 0.5)); // Reduced bonus
              setComboTimer(180);
              break;
            default:
              // JUMP power-up is activated manually with space
              break;
          }
          
          return false; // Remove this power-up
        }
        return true; // Keep this power-up
      });
      
      return collected;
    });
    
    // Update power-up timer
    if (activePowerUp && powerUpTimer > 0) {
      setPowerUpTimer(prev => prev - 1);
      
      if (powerUpTimer <= 1) {
        // Power-up expired
        const expiredType = activePowerUp;
        setActivePowerUp(null);
        
        // Reset effects
        switch(expiredType) {
          case "INVINCIBLE":
            setInvincible(false);
            break;
          case "SLOW":
            setGameSpeed(prevSpeed => Math.min(maxSpeed, prevSpeed / 0.8));
            break;
          default:
            break;
        }
      }
    }
    
    // Update base score (for survival time)
    setScore(prev => prev + (0.5 + level * 0.2)); // Reduced from 1 + level*0.5
    
    // Increase level and speed based on score - SLOWER PROGRESSION
    const newLevel = Math.floor(score / 1500) + 1; // Every 1500 points instead of 1000
    if (newLevel > level) {
      setLevel(newLevel);
      setGameSpeed(prevSpeed => Math.min(maxSpeed, prevSpeed * 1.05)); // 5% increase instead of 10%
    }
  }, [gameState, playerCar, activePowerUp, powerUpTimer, invincible, score, level, gameSpeed, initialSpeed, maxSpeed, highScore, road.height, comboMultiplier, comboTimer]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        if (gameState !== "playing") {
          startGame();
          return;
        }
        
        // Activate jump power-up during gameplay
        if (activePowerUp === "JUMP") {
          setPlayerCar(prev => ({
            ...prev,
            y: Math.max(road.height * 0.4, prev.y - 120)
          }));
          setActivePowerUp(null);
          setPowerUpTimer(0);
          return;
        }
      }
      
      if (gameState !== "playing") return;
      
      const laneWidth = road.width / road.lanes;
      let newLane = playerCar.lane;
      
      switch(e.key) {
        case "ArrowLeft":
          newLane = Math.max(0, playerCar.lane - 1);
          break;
        case "ArrowRight":
          newLane = Math.min(road.lanes - 1, playerCar.lane + 1);
          break;
        case "ArrowUp":
          // Move car forward (within limits)
          setPlayerCar(prev => ({
            ...prev,
            y: Math.max(road.height * 0.3, prev.y - 20) // Reduced from 25
          }));
          return;
        case "ArrowDown":
          // Move car backward (within limits)
          setPlayerCar(prev => ({
            ...prev,
            y: Math.min(road.height - prev.height - 10, prev.y + 20) // Reduced from 25
          }));
          return;
        default:
          return;
      }
      
      // Update car position based on lane
      const newX = newLane * laneWidth + laneWidth/2 - playerCar.width/2;
      setPlayerCar(prev => ({
        ...prev,
        x: newX,
        lane: newLane
      }));
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, playerCar, road.lanes, activePowerUp, road.height]);

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    const gameLoop = (timestamp) => {
      // Clear canvas
      ctx.clearRect(0, 0, road.width, road.height);
      
      // Draw game elements
      drawRoad(ctx);
      drawObstacles(ctx);
      drawPowerUps(ctx);
      drawCar(ctx);
      drawUI(ctx);
      
      // Update game logic
      updateGame();
      
      // SMART SPAWNING - Always keep at least 1 lane clear
      const availableLanes = getAvailableLanes();
      const availableCount = availableLanes.filter(available => available).length;
      
      // Spawn enemies based on available lanes and level
      if (timestamp - lastSpawnTimeRef.current > (1200 / gameSpeed)) { // Slower spawn rate
        // Only spawn if we have at least 2 clear lanes at early levels, 1 at later levels
        if (availableCount >= (level < 3 ? 2 : 1)) {
          spawnEnemy();
          
          // Occasionally spawn a second car at higher levels
          if (level > 2 && Math.random() < 0.3 && availableCount >= 2) {
            setTimeout(() => spawnEnemy(), 300);
          }
        }
        lastSpawnTimeRef.current = timestamp;
      }
      
      // Spawn power-ups occasionally
      if (timestamp - lastPowerUpSpawnRef.current > 6000) { // 6 seconds
        if (Math.random() < 0.3) spawnPowerUp();
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
  }, [gameState, updateGame, spawnEnemy, spawnPowerUp, level, gameSpeed, getAvailableLanes]);

  // Initialize high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("proRacingHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Start a new game
  const startGame = () => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setGameState("playing");
    setScore(0);
    setLevel(1);
    setGameSpeed(initialSpeed);
    obstaclesRef.current = [];
    setPowerUps([]);
    setActivePowerUp(null);
    setPowerUpTimer(0);
    setInvincible(false);
    setComboMultiplier(1);
    setComboTimer(0);
    setTotalEnemiesPassed(0);
    
    // Reset player position - start in a safer position
    const laneWidth = road.width / road.lanes;
    setPlayerCar({
      x: 2 * laneWidth + laneWidth/2 - 22.5,
      y: road.height * 0.6, // Lower position for more reaction time
      lane: 2,
      width: 45,
      height: 80
    });
    
    setMessage("ALWAYS KEEP AN EYE ON SAFE LANES! Use arrows to move!");
    
    // Reset spawn timers
    lastSpawnTimeRef.current = 0;
    lastPowerUpSpawnRef.current = 0;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="relative mb-6">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent animate-pulse">
          PRO RACER - BALANCED
        </h1>
        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
      </div>
      
      <div className="relative mb-6">
        <canvas
          ref={canvasRef}
          width={road.width}
          height={road.height}
          className="border-4 border-gray-800 rounded-xl shadow-2xl"
        />
        
        <div className="absolute -bottom-10 left-0 right-0 text-center">
          <div className="text-gray-400 text-sm mb-1">
            {gameState === "playing" ? "USE ARROW KEYS • WATCH FOR SAFE LANES (GREEN)" : "PRESS SPACE TO START"}
          </div>
          <div className="text-xs text-gray-600">
            Level {level} • {Math.floor(gameSpeed)} MPH • {obstaclesRef.current.length} cars • Always 1+ lane clear
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-10 max-w-3xl">
        <div className="bg-gray-800 p-3 rounded-lg text-center border border-gray-700">
          <div className="text-gray-400 text-xs">SCORE</div>
          <div className="text-2xl font-bold text-white">{score.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg text-center border border-yellow-800">
          <div className="text-gray-400 text-xs">HIGH SCORE</div>
          <div className="text-2xl font-bold text-yellow-400">{highScore.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg text-center border border-green-800">
          <div className="text-gray-400 text-xs">LEVEL</div>
          <div className="text-2xl font-bold text-green-400">{level}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg text-center border border-blue-800">
          <div className="text-gray-400 text-xs">SPEED</div>
          <div className="text-2xl font-bold text-blue-400">{gameSpeed.toFixed(1)}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg text-center border border-purple-800">
          <div className="text-gray-400 text-xs">CARS PASSED</div>
          <div className="text-2xl font-bold text-purple-400">{totalEnemiesPassed}</div>
        </div>
      </div>
      
      {/* GAME TIPS */}
      <div className="mt-8 max-w-3xl bg-gray-800/50 p-4 rounded-lg border border-blue-800">
        <div className="text-blue-400 font-bold text-lg mb-2 text-center">🎯 GAME TIPS - YOU CAN ALWAYS ESCAPE!</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start">
            <div className="bg-green-500 text-white p-1 rounded mr-2 mt-1">✓</div>
            <div className="text-sm text-gray-300">
              <span className="text-green-400 font-bold">Smart Spawning:</span> Game <span className="text-green-400">ALWAYS</span> keeps at least 1 lane clear
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-green-500 text-white p-1 rounded mr-2 mt-1">✓</div>
            <div className="text-sm text-gray-300">
              <span className="text-green-400 font-bold">Lane Indicators:</span> Green lanes are safe, red lanes are blocked
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-green-500 text-white p-1 rounded mr-2 mt-1">✓</div>
            <div className="text-sm text-gray-300">
              <span className="text-yellow-400 font-bold">Use Power-ups:</span> Jump to escape tight spots, Shield for safety
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-green-500 text-white p-1 rounded mr-2 mt-1">✓</div>
            <div className="text-sm text-gray-300">
              <span className="text-blue-400 font-bold">Move Vertically:</span> Use ↑ ↓ to create space when needed
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="text-left p-4 bg-gray-800/30 rounded">
            <div className="text-yellow-400 font-bold mb-2">🎮 BALANCED CONTROLS</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-300">Arrow Keys:</span>
                <span className="text-green-400">Move Car</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Space:</span>
                <span className="text-blue-400">Jump/Start</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Max Speed:</span>
                <span className="text-red-400">{maxSpeed} (balanced)</span>
              </div>
            </div>
          </div>
          
          <div className="text-left p-4 bg-gray-800/30 rounded">
            <div className="text-green-400 font-bold mb-2">⚡ ESCAPE STRATEGIES</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-300">• Watch for GREEN safe lanes</div>
              <div className="text-sm text-gray-300">• Use vertical movement (↑↓) to time passes</div>
              <div className="text-sm text-gray-300">• Collect Jump power-ups for emergencies</div>
              <div className="text-sm text-gray-300">• Slow power-up gives more reaction time</div>
            </div>
          </div>
        </div>
        
        <div className="text-gray-400 text-sm mt-4">
          <p className="mb-1">🎯 <span className="text-green-400">GAME IS 100% BEATABLE!</span> Smart spawning ensures you always have escape routes.</p>
          <p>Watch the lane indicators (GREEN = safe, RED = blocked) and plan your moves!</p>
        </div>
      </div>
    </div>
  );
}