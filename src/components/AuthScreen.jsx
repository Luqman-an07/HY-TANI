import React, { useState, useEffect } from 'react';
import { Sprout, Mail, User, Lock, Eye, EyeOff, ArrowRight, CheckCircle, XCircle, AlertCircle, Check, X } from 'lucide-react';

const AuthScreen = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Validation States
  const [emailStatus, setEmailStatus] = useState('neutral'); // neutral, valid, invalid
  const [emailMsg, setEmailMsg] = useState('');
  const [passwordCriteria, setPasswordCriteria] = useState({
    lower: false,
    upper: false,
    number: false,
    symbol: false,
    length: false
  });

  // --- LOGIC: PASSWORD VALIDATION (REAL TIME) ---
  useEffect(() => {
    if (isRegister) {
      const pwd = formData.password;
      setPasswordCriteria({
        lower: /[a-z]/.test(pwd),
        upper: /[A-Z]/.test(pwd),
        number: /\d/.test(pwd),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        length: pwd.length >= 8
      });
    }
  }, [formData.password, isRegister]);

  // --- LOGIC: EMAIL CHECK (REAL TIME) ---
  const checkEmail = (email) => {
    if (!email) {
      setEmailStatus('neutral');
      setEmailMsg('');
      return;
    }

    // Cek format email dasar dulu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('neutral'); // Jangan merah dulu kalau belum selesai ngetik
      return;
    }

    const users = JSON.parse(localStorage.getItem('hytani_users') || '[]');
    const userExists = users.find(u => u.email === email);

    if (isRegister) {
      // LOGIKA REGISTER: Email tidak boleh ada (Duplikat)
      if (userExists) {
        setEmailStatus('invalid'); // Merah
        setEmailMsg('Email sudah digunakan!');
      } else {
        setEmailStatus('valid'); // Hijau
        setEmailMsg('Email tersedia.');
      }
    } else {
      // LOGIKA LOGIN: Email harus ada
      if (userExists) {
        setEmailStatus('valid'); // Hijau
        setEmailMsg('Email ditemukan.');
      } else {
        setEmailStatus('invalid'); // Merah
        setEmailMsg('Email tidak terdaftar!');
      }
    }
  };

  // Handler saat mengetik
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setGlobalError('');

    if (name === 'email') {
      checkEmail(value);
    }
  };

  // Handler Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setGlobalError('');

    // 1. Validasi Awal sebelum proses
    if (isRegister) {
      const { lower, upper, number, symbol, length } = passwordCriteria;
      if (!lower || !upper || !number || !symbol || !length) {
        setGlobalError('Password belum memenuhi kriteria keamanan!');
        return;
      }
      if (emailStatus === 'invalid') {
        setGlobalError('Email tidak valid untuk pendaftaran.');
        return;
      }
    } else {
      // Login Logic Validation
      if (emailStatus === 'invalid') {
        setGlobalError('Email tidak valid. Silakan periksa kembali.');
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('hytani_users') || '[]');

      if (isRegister) {
        // PROSES REGISTER
        const newUser = { 
          name: formData.name, 
          email: formData.email, 
          password: formData.password,
          role: 'Komunikator Desa',
          isProfileComplete: false, 
          villageData: null 
        };
        
        users.push(newUser);
        localStorage.setItem('hytani_users', JSON.stringify(users));
        localStorage.setItem('hytani_session', JSON.stringify(newUser));
        onLogin(newUser);

      } else {
        // PROSES LOGIN
        const validUser = users.find(u => u.email === formData.email);
        
        if (validUser && validUser.password === formData.password) {
          // Sukses
          localStorage.setItem('hytani_session', JSON.stringify(validUser));
          onLogin(validUser);
        } else {
          // Gagal (Password Salah)
          setLoading(false);
          setGlobalError('Password salah! Silakan coba lagi.');
          setFormData(prev => ({ ...prev, password: '' })); // Kosongkan password saja
          // Email tetap dibiarkan agar user tidak perlu ketik ulang
        }
      }
    }, 1000);
  };

  // Reset form saat pindah mode (Login <-> Register)
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setFormData({ name: '', email: '', password: '' });
    setEmailStatus('neutral');
    setEmailMsg('');
    setGlobalError('');
    setPasswordCriteria({ lower: false, upper: false, number: false, symbol: false, length: false });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 min-h-[600px]">
        {/* Left Side (Visual) */}
        <div className="bg-emerald-900 p-8 flex flex-col justify-center items-center text-center md:w-5/12 relative overflow-hidden py-16 md:py-8">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl mb-6 shadow-2xl border border-white/20 relative z-10">
            <Sprout className="w-16 h-16 text-emerald-400 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight relative z-10">HY-TANI</h1>
          <p className="text-emerald-200 text-sm mt-2 uppercase tracking-widest font-medium relative z-10">Hybrid Technology for Tani</p>
          <div className="mt-10 text-emerald-100/60 text-xs relative z-10 font-mono bg-emerald-950/30 px-3 py-1 rounded-full"><p>v1.1.0 &bull; Secure Auth</p></div>
        </div>
        
        {/* Right Side (Form) */}
        <div className="p-8 md:p-12 md:w-7/12 flex flex-col justify-center bg-white overflow-y-auto max-h-[90vh]">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{isRegister ? 'Gabung Komunitas' : 'Selamat Datang'}</h2>
            <p className="text-slate-500 mb-6 leading-relaxed text-sm">{isRegister ? 'Buat akun Komunikator Desa baru.' : 'Masuk untuk akses dashboard satelit.'}</p>
            
            {/* Global Error Alert */}
            {globalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center animate-bounce">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 ml-1 uppercase">Nama Lengkap</label>
                  <div className="relative group">
                    <User className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                    <input 
                      type="text" name="name"
                      placeholder="Contoh: Luqman Anas" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                      required value={formData.name} onChange={handleChange}
                    />
                  </div>
                </div>
              )}
              
              {/* INPUT EMAIL DENGAN VALIDASI VISUAL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 ml-1 uppercase">Email</label>
                <div className="relative group">
                  <Mail className={`w-5 h-5 absolute left-3 top-3.5 transition-colors ${emailStatus === 'valid' ? 'text-emerald-500' : emailStatus === 'invalid' ? 'text-red-500' : 'text-slate-400'}`} />
                  <input 
                    type="email" name="email"
                    placeholder="email@desa.id" 
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all 
                      ${emailStatus === 'valid' ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/30' : 
                        emailStatus === 'invalid' ? 'border-red-500 focus:ring-red-500 bg-red-50/30' : 
                        'border-slate-200 focus:ring-emerald-500'}`} 
                    required value={formData.email} onChange={handleChange}
                  />
                  {/* Ikon Indikator di Kanan */}
                  {emailStatus === 'valid' && <CheckCircle className="absolute right-3 top-3.5 text-emerald-500 w-5 h-5 animate-in zoom-in" />}
                  {emailStatus === 'invalid' && <XCircle className="absolute right-3 top-3.5 text-red-500 w-5 h-5 animate-in zoom-in" />}
                </div>
                {/* Pesan Helper Email */}
                {emailMsg && (
                  <p className={`text-xs ml-1 font-medium ${emailStatus === 'valid' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {emailMsg}
                  </p>
                )}
              </div>

              {/* INPUT PASSWORD */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 ml-1 uppercase">Password</label>
                <div className="relative group">
                  <Lock className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} name="password"
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                    required value={formData.password} onChange={handleChange}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* INDIKATOR KEKUATAN PASSWORD (Hanya saat Register) */}
                {isRegister && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2 grid grid-cols-2 gap-2">
                    <CriteriaItem isValid={passwordCriteria.length} label="Min. 8 Karakter" />
                    <CriteriaItem isValid={passwordCriteria.upper} label="Huruf Besar (A-Z)" />
                    <CriteriaItem isValid={passwordCriteria.lower} label="Huruf Kecil (a-z)" />
                    <CriteriaItem isValid={passwordCriteria.number} label="Angka (0-9)" />
                    <CriteriaItem isValid={passwordCriteria.symbol} label="Simbol (!@#$)" />
                  </div>
                )}
              </div>
              
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 mt-6" disabled={loading}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span>{isRegister ? 'Daftar Sekarang' : 'Masuk Dashboard'}</span><ArrowRight size={18} /></>}
              </button>
            </form>
            
            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">{isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} <button onClick={toggleMode} className="ml-1 text-emerald-700 font-bold hover:underline transition-all">{isRegister ? 'Masuk di sini' : 'Daftar di sini'}</button></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen Kecil untuk Checklist Password
const CriteriaItem = ({ isValid, label }) => (
  <div className={`flex items-center text-xs ${isValid ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
    {isValid ? <Check size={12} className="mr-1.5" strokeWidth={3} /> : <X size={12} className="mr-1.5" />}
    {label}
  </div>
);

export default AuthScreen;