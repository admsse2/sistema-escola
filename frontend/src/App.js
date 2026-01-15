import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // O segredo da beleza estará aqui

function App() {
  const [alunos, setAlunos] = useState([]);
  const [form, setForm] = useState({ nome: '', responsavel: '', telefone: '', dataRetirada: new Date().toISOString().split('T')[0] });

  useEffect(() => { carregarAlunos(); }, []);

  const carregarAlunos = async () => {
    const res = await axios.get('https://sistema-escola-1sy0.onrender.com/alunos');
    setAlunos(res.data);
  };

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const salvar = async (e) => {
    e.preventDefault();
    await axios.post('https://sistema-escola-1sy0.onrender.com/alunos', form);
    setForm({ nome: '', responsavel: '', telefone: '', dataRetirada: new Date().toISOString().split('T')[0] });
    carregarAlunos();
  };

  const cobrar = async (id) => {
    if (!window.confirm("Disparar WhatsApp de cobrança?")) return;
    try {
        await axios.post(`https://sistema-escola-1sy0.onrender.com/cobrar/${id}`);
        alert('✅ Enviado!');
        carregarAlunos();
    } catch { alert('Erro ao enviar.'); }
  };

  const excluir = async (id) => {
    if (!window.confirm("Tem certeza que deseja EXCLUIR este aluno?")) return;
    try {
        await axios.delete(`https://sistema-escola-1sy0.onrender.com/alunos/${id}`);
        carregarAlunos();
    } catch { alert('Erro ao excluir.'); }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>🏫 School System</h2>
        <p>Painel Administrativo</p>
      </div>

      <div className="main-content">
        <header>
            <h1>Gestão de Históricos</h1>
            <span>{alunos.length} Alunos monitorados</span>
        </header>

        <div className="container">
            {/* CARD DE CADASTRO */}
            <div className="card form-card">
                <h3>✨ Novo Registro</h3>
                <form onSubmit={salvar}>
                    <input name="nome" placeholder="Nome do Aluno" value={form.nome} onChange={handleInput} required />
                    <input name="responsavel" placeholder="Responsável" value={form.responsavel} onChange={handleInput} required />
                    <input name="telefone" placeholder="WhatsApp (com DDD)" value={form.telefone} onChange={handleInput} required />
                    <input name="dataRetirada" type="date" value={form.dataRetirada} onChange={handleInput} required />
                    <button type="submit">Cadastrar Aluno</button>
                </form>
            </div>

            {/* LISTA DE ALUNOS (CARDS) */}
            <div className="lista-alunos">
                {alunos.map(aluno => (
                    <div key={aluno.id} className="card aluno-card">
                        <div className="aluno-info">
                            <h4>{aluno.nome}</h4>
                            <p>Resp: {aluno.responsavel}</p>
                            <p>📅 {new Date(aluno.dataRetirada).toLocaleDateString('pt-BR')}</p>
                            <span className={`badge ${aluno.status.includes('Cobrado') ? 'success' : 'pending'}`}>
                                {aluno.status}
                            </span>
                        </div>
                        <div className="actions">
                            <button onClick={() => cobrar(aluno.id)} className="btn-whatsapp">
                                📲 Cobrar
                            </button>
                            <button onClick={() => excluir(aluno.id)} className="btn-delete">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;