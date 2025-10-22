import { useContext } from 'react';
import ArticlesContext from '../contexts/ArticlesContext';

export default function useArticles() {
  return useContext(ArticlesContext);
}
