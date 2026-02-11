import ReactPlayer from 'react-player';

const VideoPlayer = ({ videoUrl, controls = true, width = "100%", height = "100%" }) => {
  if (!videoUrl) {
    return (
      <div className="w-full h-96 bg-black flex items-center justify-center text-white">
        No video available
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      <ReactPlayer
        url={videoUrl}
        controls={controls}
        width={width}
        height={height}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
        }}
      />
    </div>
  );
};

export default VideoPlayer;