import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../../contexts/AuthContext';
import { notifyError, notifySuccess } from '../../utils/notifications';
import logo from '../../assets/logo.png';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', matricule: '', specialite: '' });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { ...formData, role: userType === 'PRO' ? 'PRO' : 'PATIENT' });
      if (res.data.status === 'SUCCESS') {
        localStorage.setItem('token', res.data.token);
        notifySuccess("Compte créé avec succès !");
        navigate(userType === 'PRO' ? '/medecin/dashboard' : '/patient/dashboard');
      }
    } catch (error) {
      notifyError(error.response?.data?.error || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  return (
    <div className="reg-container">
      <style>{`
        .reg-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: url('/patient12.jpg') center/cover; padding: 15px; font-family: sans-serif; }
        .card { background: #374151; width: 100%; max-width: 500px; padding: 25px; border-radius: 20px; color: white; text-align: center; max-height: 90vh; overflow-y: auto; }
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        @media (max-width: 450px) { .role-grid { grid-template-columns: 1fr; } }
        .role-btn { background: #e5e7eb; border: none; padding: 20px 10px; border-radius: 15px; cursor: pointer; font-weight: 900; color: #374151; font-size: 18px; width: 100%; transition: 0.3s; }
        .role-btn:hover { background: #00a669; color: white; }
        .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; }
        .full-width { grid-column: span 2; }
        @media (max-width: 400px) { .grid-form { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } }
        .label { display: block; font-size: 12px; margin-bottom: 3px; font-weight: bold; text-transform: uppercase; }
        .input-field { width: 100%; padding: 10px; border-radius: 15px; border: none; background: #e5e7eb; color: #333; font-size: 14px; box-sizing: border-box; }
        .btn-green { width: 100%; padding: 12px; border-radius: 15px; border: none; background: #00a669; color: white; font-weight: 900; font-size: 16px; cursor: pointer; margin-top: 15px; }
      `}</style>

      <div className="card">
        <div style={{textAlign:'left', cursor:'pointer', fontSize:'12px', fontWeight:'bold', marginBottom:'15px'}} onClick={() => step === 2 ? setStep(1) : navigate('/login')}>
            <ArrowLeft size={16} /> RETOUR
        </div>
        
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginBottom:'15px'}}>
            <img src={logo} style={{height:'45px'}} alt="Logo" />
            <span style={{color: '#ff5a8d', fontWeight: '900', fontSize: '24px', marginLeft: '10px'}}>BÉNIN</span>
        </div>

        <div style={{fontSize: '18px', fontWeight:'bold', marginBottom:'20px', borderBottom:'3px solid #00a669', display:'inline-block', paddingBottom: '5px'}}>
            {step === 1 ? "CHOIX DU PROFIL" : "INSCRIPTION"}
        </div>

        {step === 1 ? (
            <div className="role-grid">
                <button className="role-btn" onClick={() => {setUserType('PATIENT'); setStep(2);}}>MAMAN</button>
                <button className="role-btn" onClick={() => {setUserType('PRO'); setStep(2);}}>PRATICIEN</button>
            </div>
        ) : (
            <form onSubmit={handleRegister} className="grid-form">
                <div><label className="label">NOM</label><input className="input-field" name="nom" onChange={handleChange} required /></div>
                <div><label className="label">PRÉNOM</label><input className="input-field" name="prenom" onChange={handleChange} required /></div>
                
                <div className="full-width"><label className="label">E-MAIL</label><input className="input-field" name="email" type="email" onChange={handleChange} required /></div>
                
                <div className="full-width">
                    <label className="label">MOT DE PASSE</label>
                    <div style={{position: 'relative'}}>
                        <input className="input-field" type={showPassword ? "text" : "password"} name="password" onChange={handleChange} required />
                        <div style={{position:'absolute', right:'15px', top:'8px', cursor:'pointer', color:'#333'}} onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>
                </div>
                
                {userType === 'PRO' && (
    <>
        <div>
            <label className="label">MATRICULE</label>
            <input className="input-field" name="matricule" onChange={handleChange} required />
        </div>
        <div>
            <label className="label">SPÉCIALITÉ</label>
            <select className="input-field" name="specialite" onChange={handleChange} required>
                <option value="">Choisir...</option>
                <option value="Gynécologue">Gynécologue</option>
                <option value="Sage-Femme">Sage-Femme</option>
            </select>
        </div>
    </>
)}
                
                <div className="full-width">
                    <button className="btn-green" type="submit" disabled={loading}>
                        {loading ? "CHARGEMENT..." : "S'INSCRIRE →"}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
}