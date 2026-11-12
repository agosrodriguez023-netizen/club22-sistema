import React from 'react';
import Login from './paginas/Login';
import { AuthProvider } from './context/AuthContext';
import './estilos/tokens.css';

export default function App() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}