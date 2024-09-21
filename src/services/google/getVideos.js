import axios from 'axios';

export default async function getVideoLinks(limit = 50) {
  console.log("Função chamada para recuperar vídeos");
  const playlistId = 'PL8kAZHXN1qcI1bSZxZG3wknenn1hg8Y6G';
  const apiKey = 'AIzaSyCPfyxqZ9OOD2LpjzyNeuYAKzZkSrzkH94';
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${limit}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.items) {
      return data.items.map((item) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      }));
      console.log(data, data.items, data.title)
    } else {
      throw new Error('No videos found');
    }
  } catch (error) {
    console.error('Error fetching video links:', error);
    return [];
  }
}
