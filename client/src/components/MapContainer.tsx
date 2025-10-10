import { useEffect, useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

type Point = { x: number; y: number };
type Wall = { x: number; y: number; w: number; h: number };
type Task = { source: Point, destination: Point, status: 'in-progress' | 'in-queue' };

interface MapData {
	dateCreated: string,
	width: number;
	height: number;
	walls: Wall[];
}

function MapContainer() {
	const [mapData, setMapData] = useState<MapData | null>(null);
	const [position, setPosition] = useState<Point | null>(null);
	const [path, setPath] = useState<Point[]>([]);
	const [task, setTask] = useState<Task | null>(null);
	const [loading, setLoading] = useState(true);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		
		const fetchData = async () => {
			try {
				console.log("Fetching robot data...");
				const db = getDatabase();
				const fs = getFirestore();
			
				// Step 1: Listen to robot state from Realtime DB
				const robotRef = ref(db, '/');
				const unsubscribeRealtime = onValue(robotRef, async (snapshot) => {
					const data = snapshot.val();
					console.log("Realtime data:", data);

					if (data) {
						setPosition(data.position);
						setPath(data.path || []);
						setTask(data.task);

						// Step 2: Fetch map info from Firestore (once per map change)
						if (data.mapId) {
							console.log("Fetching map:", data.mapId);
							const mapDoc = await getDoc(doc(fs, 'maps', data.mapId));
							if (mapDoc.exists()) {
								console.log("Map data:", mapDoc.data());
								setMapData(mapDoc.data() as MapData);
							} else {
								console.warn("Map not found!");
							}
						}
					}
					setLoading(false);
				});

				// Cleanup listener when unmounting
				return () => unsubscribeRealtime();

			} catch (err) {
				console.error("Error fetching data:", err);
				setLoading(false);
				return;
			}
		};

		fetchData();

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear previous drawings
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// --- Draw walls ---
		if (mapData) {
			ctx.fillStyle = "#888";
			mapData.walls.forEach(({ x, y, w, h }) => {
			ctx.fillRect(x, y, w, h);
			});
		}
		
		// --- Draw path ---
		if (path.length > 0) {
			ctx.strokeStyle = "blue";
			ctx.lineWidth = 4;
			ctx.beginPath();
			path.forEach((p, i) => {
				if (i === 0) ctx.moveTo(p.x, p.y);
				else ctx.lineTo(p.x, p.y);
			});
			ctx.stroke();
		}

		// --- Draw destination ---
		if (task) {
			ctx.fillStyle = "blue";
			ctx.beginPath();
			ctx.arc(task.destination.x, task.destination.y, 8, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = "white";
			ctx.beginPath();
			ctx.arc(task.destination.x, task.destination.y, 4, 0, Math.PI * 2);
			ctx.fill();
		}

		// --- Draw robot ---
		if (position) {
			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(position.x, position.y, 8, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = "white";
			ctx.beginPath();
			ctx.arc(position.x, position.y, 4, 0, Math.PI * 2);
			ctx.fill();
		}
	}, [mapData?.walls, path, position]); // redraw whenever data changes

	return (
		<div className="widget map-container">
			<h1>Robot Location</h1>

			{
				loading ? (<p>Loading data...</p>) : !mapData ? (<p>No map data available</p>) : (
					<div className="map-visual">
						<canvas
						ref={canvasRef}
						width={mapData.width}
						height={mapData.height}
						style={{
							border: "none",
							backgroundColor: "#f9f9f9",
						}}
      />
					</div>
				)
			}
		</div>
	);
};

export default MapContainer;