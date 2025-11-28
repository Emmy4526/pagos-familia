"use client";

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, increment, addDoc, where, getDocs } from 'firebase/firestore'; 
import { db } from '../lib/firebase';

interface Member {
  id: string;
  name: string;
  service: string;
  fee: number;
  balance: number;
}

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el Modal
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [amountInput, setAmountInput] = useState("");

  const CUTOFF_SPOTIFY = 17;
  const CUTOFF_YOUTUBE = 20;

  // 1. ESCUCHAR DATOS
  useEffect(() => {
    const q = query(collection(db, "members"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData: Member[] = [];
      snapshot.forEach((doc) => {
        membersData.push({ id: doc.id, ...doc.data() } as Member);
      });
      setMembers(membersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. FUNCIÓN PARA CREAR GRUPO GOOGLE (SOLO SE USA UNA VEZ)
  const createGoogleGroup = async () => {
    if (!confirm("¿Crear a Chely y Fhary en el grupo Google?")) return;
    try {
      // Verificamos si ya existen para no duplicar
      const q = query(collection(db, "members"), where("service", "==", "Google"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        alert("¡El grupo Google ya existe!");
        return;
      }

      // Creamos a los miembros
      await addDoc(collection(db, "members"), { name: "Chely", service: "Google", fee: 100, balance: 0 });
      await addDoc(collection(db, "members"), { name: "Fhary", service: "Google", fee: 100, balance: 0 });
      alert("✅ Listo. Chely y Fhary agregados a Google.");
    } catch (e) {
      alert("Error: " + e);
    }
  };

  const openModal = (member: Member) => {
    setEditingMember(member);
    setAmountInput(""); 
  };

  const saveBalance = async (amount: number, isAbsolute: boolean = false) => {
    if (!editingMember) return;
    try {
      const ref = doc(db, "members", editingMember.id);
      if (isAbsolute) await updateDoc(ref, { balance: amount });
      else await updateDoc(ref, { balance: increment(amount) });
      setEditingMember(null); 
    } catch (e) {
      alert("Error: " + e);
    }
  };

  // 3. LÓGICA DE ESTADO (Ahora soporta AÑOS para Google)
  const getMemberStatus = (member: Member) => {
    const today = new Date();
    const currentMonth = today.toLocaleString('es-ES', { month: 'long' });
    const monthCap = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
    const currentYear = today.getFullYear();

    let color = "", badgeColor = "", statusText = "", showWhatsapp = false;

    // --- LOGICA DEUDA (Para todos) ---
    if (member.balance < 0) {
      color = "border-l-8 border-red-600 bg-red-50";
      badgeColor = "bg-red-600 text-white animate-pulse";
      statusText = `⛔ DEBE $${Math.abs(member.balance)}`;
      showWhatsapp = true;
    } 
    // --- LOGICA GOOGLE (ANUAL) ---
    else if (member.service === 'Google') {
      if (member.balance >= 0 && member.balance < member.fee) {
        // Tiene 0 o menos de 100 (al corriente este año)
        color = "border-l-8 border-blue-400 bg-blue-50";
        badgeColor = "bg-blue-500 text-white";
        statusText = `👍 Al corriente (${currentYear})`;
      } else {
        // Tiene saldo extra (Pagó años adelantados)
        const yearsAhead = Math.floor(member.balance / member.fee);
        const futureYear = currentYear + yearsAhead;
        color = "border-l-8 border-indigo-500 bg-indigo-50";
        badgeColor = "bg-indigo-600 text-white";
        statusText = `✅ Pagado hasta ${futureYear}`;
      }
    }
    // --- LOGICA SPOTIFY/YOUTUBE (MENSUAL) ---
    else {
      if (member.balance >= 0 && member.balance < member.fee) {
        color = "border-l-8 border-yellow-400 bg-yellow-50";
        badgeColor = "bg-yellow-500 text-white";
        statusText = `👍 Al corriente (${monthCap})`;
      } else {
        const monthsAhead = Math.floor(member.balance / member.fee);
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + monthsAhead);
        const futureMonth = targetDate.toLocaleString('es-ES', { month: 'long' });
        statusText = `✅ Pagado hasta ${futureMonth.charAt(0).toUpperCase() + futureMonth.slice(1)}`;
        color = "border-l-8 border-green-500 bg-green-50";
        badgeColor = "bg-green-600 text-white";
      }
    }
    return { color, badgeColor, statusText, showWhatsapp };
  };

  const sendWhatsApp = (member: Member, statusText: string) => {
    const text = `Hola ${member.name}, sobre el plan ${member.service}: ${statusText}. Saldo actual: $${member.balance}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const renderColumn = (serviceName: string, icon: string, label: string, headerColor: string) => {
    const list = members.filter(m => m.service === serviceName).sort((a, b) => a.name.localeCompare(b.name));
    
    // Si no hay miembros de Google, mostramos botón para crearlos
    if (serviceName === 'Google' && list.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col items-center justify-center min-h-[200px] relative z-20">
           <h2 className="text-xl font-bold text-gray-400 mb-4">Google One</h2>
           <button onClick={createGoogleGroup} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-bold transition">
             🛠️ Crear Grupo Google
           </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full border border-gray-100 relative z-20">
        <div className={`p-6 ${headerColor} text-white shadow-md`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">{icon} {serviceName}</h2>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">{label}</span>
          </div>
        </div>
        <div className="p-4 space-y-3 flex-grow bg-gray-50">
          {list.map(member => {
            const status = getMemberStatus(member);
            return (
              <div key={member.id} className={`relative p-4 rounded-lg bg-white shadow-sm border border-gray-200 ${status.color} transition hover:shadow-md`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{member.name}</h3>
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mt-1 shadow-sm ${status.badgeColor}`}>{status.statusText}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <button onClick={() => openModal(member)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 text-xs font-bold hover:bg-blue-100">Ajustar</button>
                    {status.showWhatsapp && <button onClick={() => sendWhatsApp(member, status.statusText)} className="px-3 py-1 bg-green-100 text-green-700 rounded border border-green-200 text-xs font-bold hover:bg-green-200 flex items-center justify-center gap-1">💬 Cobrar</button>}
                  </div>
                </div>
                {member.balance !== 0 && <div className="mt-2 text-xs text-gray-400 font-mono text-right">Saldo: ${member.balance}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Cargando...</div>;

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* --- FLASH --- */}
      <style jsx>{`
        @keyframes runAcrossScreen {
          from { transform: translateX(-300px); } 
          to { transform: translateX(120vw); }   
        }
        .flash-runner {
          position: fixed; top: 20%; left: 0; height: 200px; width: auto;
          animation: runAcrossScreen 3s linear infinite; z-index: 0; opacity: 0.8; pointer-events: none;
        }
      `}</style>
      <img src="/flash.png" alt="Flash" className="flash-runner" />

      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto relative mb-10 pt-4 text-center z-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2 relative drop-shadow-sm bg-white/60 backdrop-blur-md inline-block px-4 py-1 rounded-full">
          Control de Pagos ⚡️
        </h1>
      </div>

      {/* --- COLUMNAS (AHORA SON 3) --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {renderColumn('Spotify', '🎧', `Día ${CUTOFF_SPOTIFY}`, 'bg-gradient-to-r from-[#1DB954] to-[#15883e]')}
        {renderColumn('YouTube', '📺', `Día ${CUTOFF_YOUTUBE}`, 'bg-gradient-to-r from-[#FF0000] to-[#cc0000]')}
        {renderColumn('Google', '☁️', 'Anual', 'bg-gradient-to-r from-blue-500 to-blue-700')}
      </div>

      {/* --- MODAL --- */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 relative z-50">
            <div className={`p-4 text-white text-center font-bold text-xl 
              ${editingMember.service === 'Spotify' ? 'bg-[#1DB954]' : editingMember.service === 'Google' ? 'bg-blue-600' : 'bg-[#FF0000]'}`}>
              {editingMember.name}
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm uppercase font-bold tracking-wider">Saldo Actual</p>
                <p className={`text-4xl font-black ${editingMember.balance < 0 ? 'text-red-600' : 'text-gray-800'}`}>${editingMember.balance}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => saveBalance(editingMember.fee)} className="bg-green-50 text-green-700 py-3 rounded-xl font-bold hover:bg-green-100 border border-green-200">{editingMember.service === 'Google' ? '+1 Año' : '+1 Mes'}</button>
                <button onClick={() => saveBalance(editingMember.fee * 2)} className="bg-green-50 text-green-700 py-3 rounded-xl font-bold hover:bg-green-100 border border-green-200">{editingMember.service === 'Google' ? '+2 Años' : '+2 Meses'}</button>
                <button onClick={() => saveBalance(-editingMember.fee)} className="bg-red-50 text-red-700 py-3 rounded-xl font-bold hover:bg-red-100 border border-red-200">Deuda</button>
                <button onClick={() => saveBalance(0, true)} className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 border border-gray-300">Reset $0</button>
              </div>
              <div className="flex gap-2">
                <input type="number" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="Monto manual" className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 font-bold focus:outline-none focus:border-blue-500" />
                <button onClick={() => { const val = parseInt(amountInput); if(!isNaN(val)) saveBalance(val); }} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700">Guardar</button>
              </div>
              <button onClick={() => setEditingMember(null)} className="w-full mt-4 py-3 text-gray-400 font-bold hover:text-gray-600 hover:bg-gray-50 rounded-lg transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}