import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { Sprout, Mail, User, Lock, Eye, EyeOff, ArrowRight, CheckCircle, XCircle, AlertCircle, Check, X, Loader2, ChevronLeft } from 'lucide-react';

const AuthScreen = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State Notifikasi & Error
  const [globalError, setGlobalError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false); // STATE BARU: Untuk trigger tampilan sukses

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Validation States
  const [emailStatus, setEmailStatus] = useState('neutral');
  const [emailMsg, setEmailMsg] = useState('');
  const [passwordCriteria, setPasswordCriteria] = useState({
    lower: false, upper: false, number: false, symbol: false, length: false
  });

  // --- LOGIC: PASSWORD VALIDATION ---
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

  // --- LOGIC: EMAIL CHECK ---
  const checkEmail = (email) => {
    if (!email) {
      setEmailStatus('neutral'); setEmailMsg(''); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setEmailStatus('valid'); setEmailMsg('Format email valid.');
    } else {
      setEmailStatus('invalid'); setEmailMsg('Format email salah.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setGlobalError('');
    if (name === 'email') checkEmail(value);
  };

  // --- HANDLER SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (isRegister) {
      const { lower, upper, number, symbol, length } = passwordCriteria;
      if (!lower || !upper || !number || !symbol || !length) {
        setGlobalError('Password belum memenuhi kriteria keamanan!'); return;
      }
    }
    if (emailStatus === 'invalid') {
        setGlobalError('Email tidak valid. Silakan periksa kembali.'); return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // --- REGISTER ---
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.name } }
        });

        if (error) throw error;

        // JIKA SUKSES -> AKTIFKAN TAMPILAN SUKSES
        setRegSuccess(true); 
        setFormData({ name: '', email: '', password: '' }); // Reset form

      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
            if(error.message.includes("Invalid login credentials")) throw new Error("Email atau password salah.");
            throw error;
        }
      }
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setRegSuccess(false); // Reset success state jika pindah mode
    setFormData({ name: '', email: '', password: '' });
    setEmailStatus('neutral'); setEmailMsg(''); setGlobalError('');
    setPasswordCriteria({ lower: false, upper: false, number: false, symbol: false, length: false });
  };

  // --- TAMPILAN SUKSES REGISTER (MODAL IN-PLACE) ---
  if (regSuccess) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Akun Berhasil Dibuat!</h2>
                <p className="text-slate-500 mb-8">
                    Selamat datang di ekosistem HY-TANI. Silakan masuk menggunakan email dan password yang baru saja Anda daftarkan.
                </p>
                <button 
                    onClick={() => { setRegSuccess(false); setIsRegister(false); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                    Masuk Sekarang
                </button>
            </div>
        </div>
    );
  }

  // --- TAMPILAN UTAMA (LOGIN/REGISTER FORM) ---
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
          <div className="mt-10 text-emerald-100/60 text-xs relative z-10 font-mono bg-emerald-950/30 px-3 py-1 rounded-full"><p>v2.0 &bull; Cloud Connected</p></div>
        </div>
        
        {/* Right Side (Form) */}
        <div className="p-8 md:p-12 md:w-7/12 flex flex-col justify-center bg-white overflow-y-auto max-h-[90vh]">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{isRegister ? 'Gabung Komunitas' : 'Selamat Datang'}</h2>
            <p className="text-slate-500 mb-6 leading-relaxed text-sm">{isRegister ? 'Buat akun Komunikator Desa baru.' : 'Masuk untuk akses dashboard satelit.'}</p>
            
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
                  {emailStatus === 'valid' && <CheckCircle className="absolute right-3 top-3.5 text-emerald-500 w-5 h-5 animate-in zoom-in" />}
                  {emailStatus === 'invalid' && <XCircle className="absolute right-3 top-3.5 text-red-500 w-5 h-5 animate-in zoom-in" />}
                </div>
                {emailMsg && <p className={`text-xs ml-1 font-medium ${emailStatus === 'valid' ? 'text-emerald-600' : 'text-red-500'}`}>{emailMsg}</p>}
              </div>

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
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><span>{isRegister ? 'Daftar Sekarang' : 'Masuk Dashboard'}</span><ArrowRight size={18} /></>}
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

const CriteriaItem = ({ isValid, label }) => (
  <div className={`flex items-center text-xs ${isValid ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
    {isValid ? <Check size={12} className="mr-1.5" strokeWidth={3} /> : <X size={12} className="mr-1.5" />}
    {label}
  </div>
);

export default AuthScreen;