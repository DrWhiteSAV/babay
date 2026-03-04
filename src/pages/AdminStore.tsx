import { useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import { motion } from "motion/react";
import { Save, ArrowLeft, ShoppingCart, Settings2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminStore() {
  const navigate = useNavigate();
  const { storeConfig, updateStoreConfig, shopItems, bossItems, updateShopItem, updateBossItem } = usePlayerStore();
  
  const [config, setConfig] = useState({ ...storeConfig });
  const [localShopItems, setLocalShopItems] = useState([...shopItems]);
  const [localBossItems, setLocalBossItems] = useState([...bossItems]);

  const handleChange = (key: keyof typeof config, value: string) => {
    const numValue = parseFloat(value);
    setConfig(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSave = () => {
    updateStoreConfig(config);
    localShopItems.forEach(item => updateShopItem(item.id, item));
    localBossItems.forEach(item => updateBossItem(item.id, item));
    alert("Настройки магазина и калькуляции сохранены!");
  };

  const handleShopItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...localShopItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLocalShopItems(newItems);
  };

  const handleBossItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...localBossItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLocalBossItems(newItems);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col bg-neutral-950 text-neutral-200 relative overflow-y-auto h-screen"
    >
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-24">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/admin")}
            className="p-2 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-red-500" />
            Настройки магазина
          </h1>
        </div>

        <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 mb-6 text-sm text-neutral-400">
          Здесь вы можете настроить базовые стоимости, множители и награды для систем прокачки (Телекинез и Босс), а также скорость восстановления энергии.
        </div>

        <div className="space-y-8">
          {/* Telekinesis Config */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Settings2 size={18} />
              Прокачка Телекинеза
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Базовая стоимость (Страх)</label>
                <input
                  type="number"
                  value={config.telekinesisBaseCost}
                  onChange={(e) => handleChange('telekinesisBaseCost', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Множитель стоимости</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.telekinesisCostMultiplier}
                  onChange={(e) => handleChange('telekinesisCostMultiplier', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Бонус страха за уровень</label>
                <input
                  type="number"
                  value={config.telekinesisRewardBonus}
                  onChange={(e) => handleChange('telekinesisRewardBonus', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Boss Config */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Settings2 size={18} />
              Усиление Босса
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Базовая стоимость (Арбузы)</label>
                <input
                  type="number"
                  value={config.bossBaseCost}
                  onChange={(e) => handleChange('bossBaseCost', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Множитель стоимости</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.bossCostMultiplier}
                  onChange={(e) => handleChange('bossCostMultiplier', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Базовая награда (Арбузы)</label>
                <input
                  type="number"
                  value={config.bossRewardBase}
                  onChange={(e) => handleChange('bossRewardBase', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Множитель награды</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.bossRewardMultiplier}
                  onChange={(e) => handleChange('bossRewardMultiplier', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Energy Config */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Settings2 size={18} />
              Энергия
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Время восстановления (минуты)</label>
                <input
                  type="number"
                  value={config.energyRegenMinutes}
                  onChange={(e) => handleChange('energyRegenMinutes', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Shop Items */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Package size={18} />
              Товары за Страх
            </h2>
            <div className="space-y-4">
              {localShopItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Название ({item.icon})</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleShopItemChange(index, 'name', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Стоимость (Страх)</label>
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) => handleShopItemChange(index, 'cost', parseInt(e.target.value) || 0)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boss Items */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Package size={18} />
              Экипировка для Боссов
            </h2>
            <div className="space-y-4">
              {localBossItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Название ({item.icon})</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleBossItemChange(index, 'name', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Стоимость (Арбузы)</label>
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) => handleBossItemChange(index, 'cost', parseInt(e.target.value) || 0)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          Сохранить настройки
        </button>
      </div>
    </motion.div>
  );
}
