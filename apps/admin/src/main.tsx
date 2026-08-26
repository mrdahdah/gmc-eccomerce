import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { store } from './store';
import { CategoriesPage } from './features/categories/CategoriesPage';
import './styles.css';

const pages = ['Products', 'Categories', 'Orders', 'Users', 'Notifications'];
function Dashboard() { return <section><p className="eyebrow">Operations</p><h1>Admin dashboard</h1><p>Choose a feature ticket and build it vertically across the platform.</p></section>; }
function Placeholder({ name }: { name: string }) { return <section><p className="eyebrow">Admin / {name}</p><h1>{name}</h1><p>This page is intentionally a clean foundation for its feature ticket.</p><p className="todo">TODO: connect NestJS endpoints through RTK Query.</p></section>; }
function App() { const auth = JSON.parse(localStorage.getItem('auth') ?? 'null'); if (auth?.user?.role !== 'ADMIN') return <main><article><h1>Admin access required</h1><p>Sign in with an administrator account in the storefront first.</p><Link to="http://localhost:5173/login">Open sign in</Link></article></main>; return <main><aside><strong>ATELIER / ADMIN</strong><nav><Link to="/">Dashboard</Link>{pages.map((page) => <Link key={page} to={`/${page.toLowerCase()}`}>{page}</Link>)}</nav></aside><article><Routes><Route path="/" element={<Dashboard />} /><Route path="/categories" element={<CategoriesPage />} />{pages.filter((page) => page !== 'Categories').map((page) => <Route key={page} path={`/${page.toLowerCase()}`} element={<Placeholder name={page} />} />)}</Routes></article></main>; }
createRoot(document.getElementById('root')!).render(<StrictMode><Provider store={store}><BrowserRouter><App /></BrowserRouter></Provider></StrictMode>);
