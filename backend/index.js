const express = require('express');
const savedLocationsRoutes = require('./routes/savedLocationsRoutes');
const authRoutes = require('./routes/authRoutes');
const profilePictureRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// routes
app.use('/api/savedLocations', savedLocationsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profilePicture', profilePictureRoutes);

// Catch-all 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



// // --- Simple Graph Model for Pathfinding ---
// // Each node has: id, name, floor, neighbors: [{ id, weight }]
// const graph = {
//   'A': { id: 'A', name: 'Library', floor: 1, neighbors: [{ id: 'B', weight: 1 }] },
//   'B': { id: 'B', name: 'Stairs 1', floor: 1, neighbors: [{ id: 'A', weight: 1 }, { id: 'C', weight: 1 }, { id: 'E', weight: 2 }] },
//   'C': { id: 'C', name: 'Canteen', floor: 1, neighbors: [{ id: 'B', weight: 1 }] },
//   'E': { id: 'E', name: 'Stairs 1 (2F)', floor: 2, neighbors: [{ id: 'B', weight: 2 }, { id: 'F', weight: 1 }] },
//   'F': { id: 'F', name: 'Lecture Hall', floor: 2, neighbors: [{ id: 'E', weight: 1 }] },
// };

// // --- A* Pathfinding Algorithm ---
// function heuristic(a, b) {
//   // Simple heuristic: floor difference + 1 (if on different floors), else 0
//   return Math.abs(graph[a].floor - graph[b].floor);
// }

// function aStar(start, goal) {
//   const openSet = new Set([start]);
//   const cameFrom = {};
//   const gScore = { [start]: 0 };
//   const fScore = { [start]: heuristic(start, goal) };

//   while (openSet.size > 0) {
//     // Get node in openSet with lowest fScore
//     let current = null;
//     let minF = Infinity;
//     for (let node of openSet) {
//       if (fScore[node] < minF) {
//         minF = fScore[node];
//         current = node;
//       }
//     }
//     if (current === goal) {
//       // Reconstruct path
//       const path = [current];
//       while (cameFrom[current]) {
//         current = cameFrom[current];
//         path.unshift(current);
//       }
//       return path;
//     }
//     openSet.delete(current);
//     for (const neighbor of graph[current].neighbors) {
//       const tentativeG = gScore[current] + neighbor.weight;
//       if (tentativeG < (gScore[neighbor.id] || Infinity)) {
//         cameFrom[neighbor.id] = current;
//         gScore[neighbor.id] = tentativeG;
//         fScore[neighbor.id] = tentativeG + heuristic(neighbor.id, goal);
//         openSet.add(neighbor.id);
//       }
//     }
//   }
//   return null; // No path found
// }

// // --- API: Get Path ---
// // POST /api/path
// // Given a start and end location, returns the best path for navigation.
// app.post('/api/path', (req, res) => {
//   const { start, end } = req.body;
//   if (!graph[start] || !graph[end]) {
//     return res.status(400).json({ error: 'Invalid start or end node' });
//   }
//   const path = aStar(start, end);
//   if (!path) {
//     return res.status(404).json({ error: 'No path found' });
//   }
//   res.json({ path, message: `Path from ${start} to ${end}` });
// });