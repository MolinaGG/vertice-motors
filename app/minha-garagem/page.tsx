import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '../chatgpt-auth';
import Garage from './Garage';
import './garage.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Minha garagem | Vértice Motors',
  description: 'Seus veículos favoritos e seu histórico de consultas FIPE.',
  robots: { index: false, follow: false },
};

export default async function GaragePage() {
  const user = await getChatGPTUser();
  return <Garage nativeAuthenticated={Boolean(user)} loginUrl={chatGPTSignInPath('/minha-garagem')} logoutUrl={chatGPTSignOutPath('/')} />;
}
