import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { testDataMicroStops } from '@/lib/mockData/test-data-microStops';
import { generateChartColors } from '@/lib/utils/colors';

interface ChartDataItem {
  date: string;
  [key: string]: number | string;
}

export function MicroStopStackChart({ chartWidth }: { chartWidth: number }) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [hiddenBars, setHiddenBars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const groupedData = testDataMicroStops.reduce((acc: Record<string, ChartDataItem>, curr) => {
      const date = curr.dttime.split('-').slice(1).join('-');
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][curr.errid] = (Number(acc[date][curr.errid]) || 0) + curr.total_errcount;
      return acc;
    }, {});

    setChartData(Object.values(groupedData));
    const types = [...new Set(testDataMicroStops.map(item => item.errid))];
    setErrorTypes(types);
    
    const initialHiddenBars: Record<string, boolean> = {};
    types.forEach(type => {
      initialHiddenBars[type] = false;
    });
    setHiddenBars(initialHiddenBars);
  }, []);

  const handleLegendClick = useCallback((dataKey: string) => {
    // 如果点击的是"全选"按钮
    if (dataKey === 'all') {
      const newHiddenBars: Record<string, boolean> = {};
      // 检查是否有任何类型被隐藏
      const shouldShow = errorTypes.some(type => hiddenBars[type]);
      // 根据当前状态，全部显示或全部隐藏
      errorTypes.forEach(type => {
        newHiddenBars[type] = !shouldShow;
      });
      setHiddenBars(newHiddenBars);
    // 如果点击的是具体的错误类型
    } else {
      setHiddenBars(prev => {
        const newHiddenBars = { ...prev };
        newHiddenBars[dataKey] = !prev[dataKey];
        return newHiddenBars;
      });
    }
  }, [errorTypes, hiddenBars]);

  return (
    // 占满父容器
    <div className="w-full h-full">
      <ResponsiveContainer width={chartWidth} height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          barSize={60}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            fontSize={14}
          />
          <YAxis fontSize={14} />
          <Tooltip 
            formatter={(value: any, name: string) => [value, name]}
            itemSorter={(item) => {
              // 按数值从大到小排序，返回负值表示降序
              return -Number(item.value || 0);
            }}
          />
          <Legend 
            onClick={({ id = '' }) => handleLegendClick(id)}
            wrapperStyle={{ 
              left: 0, 
              paddingTop: '10px',
              fontFamily: 'Noto Sans SC, Noto Sans JP',
              fontSize: '12px'
            }}
            iconType="circle"
            iconSize={10}
            payload={[
              { 
                value: errorTypes.some(type => hiddenBars[type]) ? '全选' : '取消全选', 
                type: 'circle' as const, 
                id: 'all',
                color: '#8884d8'
              },
              ...errorTypes.map((type, index) => ({
                value: type,
                type: 'circle' as const,
                color: generateChartColors(errorTypes.length)[index],
                id: type
              }))
            ]}
          />
          <Bar
            dataKey="all"
            stackId="a"
            fill="#8884d8"
            hide={true}
          />
          {errorTypes.map((type, index) => (
            <Bar
              key={`bar-${type}-${index}`}
              dataKey={type}
              stackId="a"
              fill={generateChartColors(errorTypes.length)[index]}
              hide={hiddenBars[type]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}