import React from 'react';

const Loader = ({ size = 'md', message = '', fullscreen = false, type = 'spinner' }) => {
  // Size constraints
  const dimensions = {
    sm: { w: 'w-6', h: 'h-6', text: 'text-xs' },
    md: { w: 'w-10', h: 'h-10', text: 'text-sm' },
    lg: { w: 'w-16', h: 'h-16', text: 'text-base' },
    xl: { w: 'w-24', h: 'h-24', text: 'text-lg' }
  };

  const currentDim = dimensions[size] || dimensions.md;

  // Premium Spinner: sleek ring with fading tail
  const SpinnerLoader = () => (
    <div className={`relative ${currentDim.w} ${currentDim.h}`}>
      <div className="absolute inset-0 rounded-full border-4 border-[#00c950]/20"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00c950] animate-spin"></div>
    </div>
  );

  // Pharmacy-Themed Pill Loader: A capsule spinning or floating
  const PillLoader = () => (
    <div className={`relative ${currentDim.w} ${currentDim.h} flex items-center justify-center animate-bounce-gentle`}>
      <div className="relative w-full h-full animate-spin-slow">
        {/* Capsule Half 1 */}
        <div className="absolute top-0 left-0 w-full h-[50%] bg-[#00c950] rounded-t-full opacity-90"></div>
        {/* Capsule Half 2 */}
        <div className="absolute bottom-0 left-0 w-full h-[50%] bg-[#00c950]/30 rounded-b-full backdrop-blur-sm"></div>
        {/* Reflection */}
        <div className="absolute top-[10%] left-[20%] w-[20%] h-[30%] bg-white/40 rounded-full rotate-12"></div>
      </div>
    </div>
  );

  // Refined Wave Loader
  const WaveLoader = () => (
    <div className="flex items-center space-x-1 h-full min-h-[2rem]">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-[4px] bg-[#00c950] rounded-full animate-wave`}
          style={{
            height: size === 'sm' ? '12px' : size === 'lg' ? '32px' : '20px',
            animationDelay: `${i * 0.1}s`
          }}
        ></div>
      ))}
    </div>
  );

  // Render Logic
  const renderLoader = () => {
    switch (type) {
      case 'pill':
        return <PillLoader />;
      case 'wave':
        return <WaveLoader />;
      case 'cross': // Mapping cross to pill for modern pharmacy feel if strictly requested, or just standard spinner
      case 'spinner':
      default:
        return <SpinnerLoader />;
    }
  };

  const Content = () => (
    <div className="flex flex-col items-center justify-center gap-4">
      {renderLoader()}
      {message && (
        <p className={`font-medium tracking-wide text-gray-600 ${currentDim.text} animate-pulse px-4 text-center`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-300">
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center">
          <Content />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-4">
      <Content />
    </div>
  );
};

// Add styles required for custom animations
const style = document.createElement('style');
style.innerHTML = `
  @keyframes wave {
    0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
    50% { transform: scaleY(1); opacity: 1; }
  }
  .animate-wave {
    animation: wave 1s ease-in-out infinite;
  }
  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
  @keyframes bounce-gentle {
     0%, 100% { transform: translateY(-5%); }
     50% { transform: translateY(5%); }
  }
  .animate-bounce-gentle {
    animation: bounce-gentle 2s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default Loader;