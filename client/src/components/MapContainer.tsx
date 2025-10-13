import { useEffect, useState, useRef, useCallback } from 'react';
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
	const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const isDraggingRef = useRef(false);
	const lastPosRef = useRef({ x: 0, y: 0 });

	// Firebase listener on mount
	useEffect(() => {
		const db = getDatabase();
		const fs = getFirestore();
		const robotRef = ref(db, '/');
		const currentMapId = {value: null};

		// Realtime Database listener
		const unsubscribeRealtime = onValue(robotRef, async (snapshot) => {
			const data = snapshot.val();
			if (!data) return;

			setPosition(data.position);
			setPath(data.path || []);
			setTask(data.task);

			// Fetch Firestore map only when mapId changes
			if (data.mapId && data.mapId !== currentMapId.value) {
				currentMapId.value = data.mapId;

				try {
					// Get map document from Firestore collection maps named 'temp-map' (data.mapId)
					const mapDoc = await getDoc(doc(fs, 'maps', data.mapId));

					if (mapDoc.exists()) {
						setMapData(mapDoc.data() as MapData);
					} else {
						console.warn("Map not found!");
					}

				} catch (err) {
					console.error("Error fetching map: ", err);
				}
			}

			// Set state to 'finished loading'
			setLoading(false);
		});

		// Cleanup when component unmounts
		return () => {
			console.log("Cleaning up Firebase Listener...");
			unsubscribeRealtime();
		};
	}, []);

	// Drawing Logic

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !mapData) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		const { width, height } = canvas;
		ctx.clearRect(0, 0, width, height);

		ctx.save();

		// --- Draw grid ---
		const gridSize = 50;
		ctx.strokeStyle = '#e9ecef';
		ctx.lineWidth = 1;

		for (let x = (offset.x % gridSize); x < width; x += gridSize) {
			
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
		for (let y = (offset.y % gridSize); y < height; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		ctx.translate(offset.x, offset.y); // Apply map offset
		ctx.scale(zoom, zoom); // Apply zoom

		// --- Draw walls ---
		ctx.fillStyle = '#6c757d';
		mapData.walls.forEach(({ x, y, w, h }) => {
			ctx.fillRect(x, y, w, h);
		});

		// --- Draw path ---
		if (path.length > 0) {
			ctx.strokeStyle = '#3513e1';
			ctx.lineWidth = 4;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.beginPath();
			path.forEach((p, i) => {
				if (i === 0) ctx.moveTo(p.x, p.y);
				else ctx.lineTo(p.x, p.y);
			});
			ctx.stroke();
			
			// Draw path points
			ctx.fillStyle = '#3513e1';
			path.forEach((p) => {
				ctx.beginPath();
				ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
				ctx.fill();
			});
		}

		// --- Draw destination ---
		if (task) {
			ctx.fillStyle = '#28a745';
			ctx.beginPath();
			ctx.arc(task.destination.x, task.destination.y, 10, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.arc(task.destination.x, task.destination.y, 6, 0, Math.PI * 2);
			ctx.fill();
		}

		// --- Draw robot ---
		if (position) {
			ctx.fillStyle = '#dc3545';
			ctx.beginPath();
			ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.arc(position.x, position.y, 6, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.restore();
	}, [mapData, path, position, task, offset, zoom]);

	useEffect(() => {
		draw();
	}, [draw, offset, mapData, path, position, task, zoom]);
		
	// --- Resize and redraw on window resize ---
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const container = canvas.parentElement;
		if (!container) return;

		const resizeCanvas = () => {
			canvas.width = container.clientWidth;
			canvas.height = container.clientHeight;
			draw(); // Safe since draw is stable via useCallback
		};

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		return () => window.removeEventListener('resize', resizeCanvas);
	}, [mapData]);

	// --- Drag-to-pan functionality ---
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleMouseDown = (e: MouseEvent) => {
			isDraggingRef.current = true;
			lastPosRef.current = { x: e.clientX, y: e.clientY };
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDraggingRef.current) return;

			const dx = e.clientX - lastPosRef.current.x;
			const dy = e.clientY - lastPosRef.current.y;

			setOffset(prev => ({
				x: prev.x + dx,
				y: prev.y + dy,
			}));
			lastPosRef.current = { x: e.clientX, y: e.clientY };
		};

		const handleMouseUp = () => {
			isDraggingRef.current = false;
		};

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const delta = e.deltaY > 0 ? 0.9 : 1.1;
			setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
		};

		canvas.addEventListener('mousedown', handleMouseDown);
		canvas.addEventListener('wheel', handleWheel, { passive: false });
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			canvas.removeEventListener('mousedown', handleMouseDown);
			canvas.removeEventListener('wheel', handleWheel);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [mapData]);

	const handleZoomIn = () => {
		setZoom(prev => Math.min(prev * 1.2, 3)); // Max zoom 3x
	};

	const handleZoomOut = () => {
		setZoom(prev => Math.max(prev / 1.2, 0.3)); // Min zoom 0.3x
	};

	const handleResetZoom = () => {
		setZoom(1);
		setOffset({ x: 0, y: 0 });
	};

	return (
		<div className="widget map-container light-shadow">
			<h1>Robot Location</h1>
			{
				loading ? (<p>Loading data...</p>) : !mapData ? (<p>No map data available</p>) : (
					<div className="map-visual">
						<canvas
						ref={canvasRef}
						width={mapData.width}
						height={mapData.height}
						
						/>
						<div className="map-controls">
							<button className="zoom-btn zoom-in" onClick={handleZoomIn} title="Zoom In">
								+
							</button>
							<button className="zoom-btn zoom-out" onClick={handleZoomOut} title="Zoom Out">
								−
							</button>
							<button className="zoom-btn zoom-reset" onClick={handleResetZoom} title="Reset View">
								⌂
							</button>
						</div>
					</div>
				)
			}
		</div>
	);
};

export default MapContainer;