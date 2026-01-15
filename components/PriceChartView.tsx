
import React, { useState } from 'react';

interface PriceChartViewProps {
  network: any; // Using `any` for simplicity as NetworkState is in another file
  onClose: () => void;
}

type TimeFrame = '1H' | '24H' | '7D';
type OHLC = { open: number; high: number; low: number; close: number; timestamp: number };

// --- UTILITY FUNCTIONS ---

// 1. Function to create OHLC candles from a flat price array
const createCandles = (prices: number[], timeFrame: TimeFrame): OHLC[] => {
    if (!prices || prices.length === 0) return [];

    // Group prices to form candles. More prices = more groups.
    const groupSize = timeFrame === '1H' ? 2 : timeFrame === '24H' ? 1 : 1;
    const candles: OHLC[] = [];
    
    for (let i = 0; i < prices.length; i += groupSize) {
        const chunk = prices.slice(i, i + groupSize);
        if (chunk.length === 0) continue;

        const open = chunk[0];
        const close = chunk[chunk.length - 1];
        const high = Math.max(...chunk);
        const low = Math.min(...chunk);

        candles.push({ open, high, low, close, timestamp: i });
    }
    return candles;
};

// 2. Function to calculate Exponential Moving Average (EMA)
const calculateEMA = (prices: number[], period: number): (number | null)[] => {
    if (prices.length < period) return Array(prices.length).fill(null);
    const k = 2 / (period + 1);
    const emaArray: (number | null)[] = Array(prices.length).fill(null);
    let sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    emaArray[period - 1] = sma;

    for (let i = period; i < prices.length; i++) {
        emaArray[i] = (prices[i] * k) + (emaArray[i - 1]! * (1 - k));
    }
    return emaArray;
};

export const PriceChartView: React.FC<PriceChartViewProps> = ({ network, onClose }) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('24H');

    const renderCandlestickChart = () => {
        const prices = network.priceHistory[timeFrame === '1H' ? 'hour' : timeFrame === '24H' ? 'day' : 'week'];
        if (!prices || prices.length < 2) return <div className="text-center text-xs text-slate-500">Awaiting Price Data...</div>;
        
        const candles = createCandles(prices, timeFrame);
        const closingPrices = candles.map(c => c.close);
        
        const ema10 = calculateEMA(closingPrices, 5);
        const ema20 = calculateEMA(closingPrices, 10);
        const ema50 = calculateEMA(closingPrices, 20);

        const allValues = candles.flatMap(c => [c.high, c.low]);
        const maxPrice = Math.max(...allValues);
        const minPrice = Math.min(...allValues);
        const priceRange = maxPrice - minPrice || 1;

        const width = 500;
        const height = 300;
        const candleWidth = width / (candles.length * 1.5);
        
        const getY = (price: number) => height - ((price - minPrice) / priceRange) * height;
        const getX = (index: number) => (index / candles.length) * width + (width / candles.length / 2);

        const emaToPath = (emaData: (number | null)[]) => {
            let path = '';
            let firstPoint = true;
            emaData.forEach((val, i) => {
                if (val !== null) {
                    const x = getX(i);
                    const y = getY(val);
                    if (firstPoint) {
                        path += `M ${x} ${y}`;
                        firstPoint = false;
                    } else {
                        path += ` L ${x} ${y}`;
                    }
                }
            });
            return path;
        };
        
        return (
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid */}
                {[...Array(5)].map((_, i) => (
                    <line key={`grid-h-${i}`} x1="0" y1={(height / 4) * i} x2={width} y2={(height / 4) * i} stroke="rgba(255,255,255,0.05)" />
                ))}

                {/* Candles */}
                {candles.map((candle, i) => {
                    const x = getX(i);
                    const isGreen = candle.close >= candle.open;
                    const bodyY = isGreen ? getY(candle.close) : getY(candle.open);
                    const bodyHeight = Math.abs(getY(candle.open) - getY(candle.close)) || 1;

                    return (
                        <g key={i} className="candle">
                            <line x1={x} y1={getY(candle.high)} x2={x} y2={getY(candle.low)} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1" />
                            <rect x={x - candleWidth / 2} y={bodyY} width={candleWidth} height={bodyHeight} fill={isGreen ? '#10b981' : '#ef4444'} />
                        </g>
                    );
                })}

                {/* EMAs */}
                <path d={emaToPath(ema10)} fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
                <path d={emaToPath(ema20)} fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
                <path d={emaToPath(ema50)} fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />

                 {/* Price Scale */}
                {[...Array(5)].map((_, i) => {
                    const price = minPrice + (priceRange / 4) * i;
                    return (
                        <text key={`price-label-${i}`} x={width - 5} y={getY(price) + 3} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="end">
                            {price.toFixed(6)}
                        </text>
                    );
                })}
            </svg>
        );
    };

    const currentPrice = network.totalMined > 0 ? (network.liquidityPoolTON / network.totalMined) : 0;

    return (
        <div className="fixed inset-0 z-[150] bg-[#0A0F19] flex flex-col font-sans animate-fade-in p-4 pt-6">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">N</div>
                    <div>
                        <h2 className="text-sm font-bold text-white">NEUROCOIN / TON</h2>
                        <p className="text-xs text-green-400 font-mono">{currentPrice.toFixed(6)}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">&times;</button>
            </div>

            <div className="flex gap-2 mb-4 shrink-0">
                {(['1H', '24H', '7D'] as TimeFrame[]).map(tf => (
                    <button 
                        key={tf} 
                        onClick={() => setTimeFrame(tf)} 
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${timeFrame === tf ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'}`}
                    >
                        {tf}
                    </button>
                ))}
            </div>

            <div className="flex-1 w-full bg-black/50 rounded-lg border border-white/10 overflow-hidden">
                {renderCandlestickChart()}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 shrink-0">
                <button className="w-full py-3 bg-green-600/90 text-white font-bold text-xs uppercase rounded-lg">BUY</button>
                <button className="w-full py-3 bg-red-600/90 text-white font-bold text-xs uppercase rounded-lg">SELL</button>
            </div>
        </div>
    );
};
