import React from 'react';

interface MindMapNodeData {
  label: string;
  children?: MindMapNodeData[];
}

interface Props {
  data: string | MindMapNodeData; // Can be JSON string or object
}

const TreeNode: React.FC<{ node: MindMapNodeData; isRoot?: boolean }> = ({ node, isRoot = false }) => {
  if (!node) return null;

  return (
    <li className="relative p-2 list-none">
        <div className={`
            inline-block px-4 py-2 rounded-xl border-2 font-medium transition-all hover:scale-105
            ${isRoot 
                ? 'bg-blue-600 text-white border-blue-700 shadow-md text-lg' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 shadow-sm text-sm'
            }
        `}>
            {node.label}
        </div>
        
        {node.children && node.children.length > 0 && (
            <ul className="flex flex-row flex-wrap justify-center gap-4 pt-4 relative 
                before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-px before:h-4 before:bg-gray-300 dark:before:bg-gray-600">
                {node.children.map((child, idx) => (
                    <div key={idx} className="relative flex flex-col items-center
                        before:content-[''] before:absolute before:top-[-16px] before:left-1/2 before:-translate-x-1/2 before:w-full before:h-px before:bg-gray-300 dark:before:bg-gray-600
                        first:before:w-[50%] first:before:left-[50%] 
                        last:before:w-[50%] last:before:left-0
                        only:before:hidden
                    ">
                         {/* Vertical Connector for child */}
                         <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mb-0"></div>
                        <TreeNode node={child} />
                    </div>
                ))}
            </ul>
        )}
    </li>
  );
};

const MindMapRenderer: React.FC<Props> = ({ data }) => {
  let parsedData: MindMapNodeData;

  try {
    parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    return <div className="text-red-500 p-4 border border-red-200 rounded">Invalid Mind Map JSON format</div>;
  }

  return (
    <div className="w-full overflow-x-auto p-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <ul className="flex justify-center text-center">
        <TreeNode node={parsedData} isRoot={true} />
      </ul>
    </div>
  );
};

export default MindMapRenderer;
