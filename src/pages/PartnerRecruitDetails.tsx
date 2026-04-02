import { Link } from 'react-router-dom';

export default function PartnerRecruitDetails() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa] text-[#1a1a1a] relative font-sans">
      <header className="shrink-0 sticky top-0 z-50 px-4 py-3">
        <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl px-4 py-2 flex items-center justify-between shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img alt="Inviter Avatar" className="w-9 h-9 rounded-full border-2 border-[#991b1b]/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpH8Yq1cdjXHoxw0kH3ynA77VT5OEVN3hn1p5gdlXKMZkuAWQkc4dwmiUYwTQdmxhxfA-nrFZvCa-RBN-kH9EX2UVpq7Aq4nMh8vxj-I-UH0q6tliXvDjBJBsjVoYa-VfRhM134CEmnv2eOJMC9jAeN-TVJYnUWl6b2HUycpBuKzfb-Qcm2UPBOhZMaCJCbJErRCoH-Fki41WPfNsOSg9k0CXgoNK-BkUm32ikNcuoI-d9L40HgcmyKMeefEtP6Jn4SjX7qVKuocw"/>
              <span className="absolute -bottom-1 -right-1 bg-[#991b1b] text-white text-[8px] px-1 rounded-full border border-white">VIP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-800">张三邀请你加入合伙人</span>
              <span className="text-[10px] text-gray-400">携手共创电商未来</span>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            已成功邀请 <span className="text-[#991b1b] font-bold">12</span> 位
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <section className="relative px-4 pt-4 pb-16 overflow-hidden">
          <div className="rounded-[2rem] p-8 text-white relative overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]" style={{ background: 'linear-gradient(145deg, #991b1b 0%, #dc2626 100%)' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 right-4 opacity-15 transform rotate-[-10deg]">
              <span className="material-symbols-outlined text-[100px]">shopping_bag</span>
            </div>
            <div className="relative z-10 text-center">
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-medium tracking-wider mb-4 border border-white/30 uppercase">
                Limited Partner Program
              </div>
              <h1 className="text-3xl font-extrabold mb-3 tracking-tight leading-tight">合伙人招募计划</h1>
              <p className="text-sm font-medium opacity-90 mb-1">零成本创业 · 享持续分红</p>
              <p className="text-xs opacity-75 mb-8">扫码加入，开启城市合伙人新征程</p>
              <Link to="/register" className="inline-block bg-white text-[#991b1b] px-8 py-3.5 rounded-full font-bold text-sm active:scale-95 transition-all" style={{ boxShadow: '0 4px 15px rgba(153, 27, 27, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)' }}>
                立即加入合伙人
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 -mt-10 relative z-10">
          <div className="bg-white p-6 rounded-3xl border border-gray-50 flex justify-around shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#991b1b]">
                <span className="material-symbols-outlined">group_add</span>
              </div>
              <span className="text-xs font-bold text-gray-700">社交建立团队</span>
            </div>
            <div className="w-px h-10 bg-gray-100 self-center"></div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#991b1b]">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className="text-xs font-bold text-gray-700">获得持续收益</span>
            </div>
            <div className="w-px h-10 bg-gray-100 self-center"></div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#991b1b]">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <span className="text-xs font-bold text-gray-700">官方授权保障</span>
            </div>
          </div>
        </section>

        <section className="mt-12 px-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extrabold text-gray-800">合伙人核心权益</h3>
            <span className="text-[10px] text-gray-400 font-medium">Core Benefits</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-50 text-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200 text-white">
                <span className="material-symbols-outlined text-xl">savings</span>
              </div>
              <p className="text-xs font-bold text-gray-800 mb-1">佣金收益</p>
              <p className="text-[10px] text-gray-400">20%销售提成</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-50 text-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200 text-white">
                <span className="material-symbols-outlined text-xl">hub</span>
              </div>
              <p className="text-xs font-bold text-gray-800 mb-1">团队收益</p>
              <p className="text-[10px] text-gray-400">无限层级裂变</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-50 text-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-200 text-white">
                <span className="material-symbols-outlined text-xl">auto_graph</span>
              </div>
              <p className="text-xs font-bold text-gray-800 mb-1">分红收益</p>
              <p className="text-[10px] text-gray-400">季度全球分红</p>
            </div>
          </div>
        </section>

        <section className="mt-12 px-6">
          <div className="flex flex-col items-center mb-10">
            <h3 className="text-lg font-extrabold text-gray-800 mb-1">收益进阶模型</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Growth Path</p>
          </div>
          <div className="relative space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-red-100 z-10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
                <span className="material-symbols-outlined text-[#991b1b]">share</span>
              </div>
              <div className="flex-grow bg-white p-4 rounded-2xl border border-gray-50 flex justify-between items-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
                <span className="font-bold text-sm text-gray-700">第一阶段：分享好友</span>
                <span className="text-[10px] font-medium bg-red-50 text-[#991b1b] px-2 py-0.5 rounded-full">入门</span>
              </div>
            </div>
            <div className="flex justify-center -my-2 relative">
              <div className="w-[2px] h-6 bg-gradient-to-b from-[#991b1b] to-transparent opacity-30"></div>
            </div>
            <div className="flex items-center space-x-4 pl-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-red-200 z-10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
                <span className="material-symbols-outlined text-[#991b1b]">shopping_cart_checkout</span>
              </div>
              <div className="flex-grow bg-white p-4 rounded-2xl border border-red-100 flex justify-between items-center shadow-[0_0_20px_rgba(153,27,27,0.15)]">
                <span className="font-bold text-sm text-gray-800">第二阶段：好友下单购买</span>
                <span className="text-[10px] font-medium bg-red-100 text-[#991b1b] px-2 py-0.5 rounded-full">转化</span>
              </div>
            </div>
            <div className="flex justify-center -my-2 relative">
              <div className="w-[2px] h-6 bg-gradient-to-b from-[#991b1b] to-transparent opacity-30"></div>
            </div>
            <div className="flex items-center space-x-4 pl-8">
              <div className="flex-shrink-0 w-12 h-12 bg-[#991b1b] rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 z-10 text-white">
                <span className="material-symbols-outlined">redeem</span>
              </div>
              <div className="flex-grow bg-gradient-to-r from-[#991b1b]/5 to-white p-4 rounded-2xl border-l-4 border-[#991b1b] flex justify-between items-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
                <span className="font-extrabold text-sm text-gray-800">第三阶段：获得 20% 佣金</span>
                <span className="text-[10px] font-bold text-[#991b1b]">获利</span>
              </div>
            </div>
            <div className="flex justify-center -my-2 relative">
              <div className="w-[2px] h-6 bg-gradient-to-b from-[#991b1b] to-transparent opacity-30"></div>
            </div>
            <div className="flex items-center space-x-4 pl-12">
              <div className="flex-shrink-0 w-12 h-12 bg-red-800 rounded-2xl flex items-center justify-center shadow-lg shadow-red-300 z-10 text-white">
                <span className="material-symbols-outlined">groups_3</span>
              </div>
              <div className="flex-grow bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-gray-800">终极阶段：建立团队分红</span>
                  <span className="text-[10px] text-gray-400">开启被动收入大门</span>
                </div>
                <span className="material-symbols-outlined text-[#991b1b] text-xl">star</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 px-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extrabold text-gray-800">精英合伙人见证</h3>
            <span className="text-[#991b1b] text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded">已有2000+加入</span>
          </div>
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-50 flex items-center space-x-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
              <img alt="User" className="w-14 h-14 rounded-2xl object-cover shadow-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDygH4x5HTJpZ0zOcXQqmCsKg4BVhWAikTR-FWVoPzdCHlvNxuyrdOt7qoYFTEHdz0dOpwAiDK4NcQ7sHYFaejFtC4zHOjrT4NZijvrGRNjUodLFiwq_puHdy4nYDZMRvBAUSKZwjdgCrvDmgNlA6QR3rcXzwThyFlewwdxQCcWeReGQXfu19BHbL7tDfQuMIs8fXJsQmbpz-kNRww3HBH1m2bswIe7NT0yZTLZVHyGfZFleYvogPYNAcwxDq9MS2UOZiJFvB9o1aM"/>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-extrabold text-gray-800 text-sm">李先生</p>
                  <span className="text-[10px] text-gray-400">已加入 185天</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">团队规模：38人精英团队</p>
                <div className="flex items-center text-[#991b1b] font-bold text-sm">
                  <span className="text-[10px] font-normal mr-1">累计收益:</span> ¥56,000.00
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-50 flex items-center space-x-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
              <img alt="User" className="w-14 h-14 rounded-2xl object-cover shadow-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1ds40fHbIBxo5udR6e2w0tzgZjVLAvBxZ_JUO2puNolZijxa6TvZcBsMtnLyeCnZVj1hBBhp-OQ4STo6fDBOz_uhOlI9BCGgMpmrRRZYA-50kmkoB6lvWpze6SPJHpwy4Q29kEd1u8nTboO1GCUmk24cwDvSl3zuLxvDKCkoz0FbHm_iFiQfzOxz5wajPjo9FPej3PeV8Uh4fZtYam0Ny5JHZ6SPEUUpP8zbazQ_9NWdyjZTYIgA2U8gjymlqmyafS35jtmK4R5E"/>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-extrabold text-gray-800 text-sm">王女士</p>
                  <span className="text-[10px] text-gray-400">已加入 92天</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">团队规模：25人稳定团队</p>
                <div className="flex items-center text-[#991b1b] font-bold text-sm">
                  <span className="text-[10px] font-normal mr-1">累计收益:</span> ¥32,000.00
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 px-6">
          <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-[2.5rem] p-10 text-center relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#991b1b]/5 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-600 mb-4 tracking-widest uppercase">合伙人准入门槛</h3>
            <div className="flex items-baseline justify-center mb-6">
              <span className="text-2xl font-bold text-[#991b1b] mr-1">¥</span>
              <span className="text-6xl font-black text-[#991b1b] tracking-tighter">3398</span>
            </div>
            <div className="inline-block px-4 py-2 bg-white rounded-2xl shadow-sm border border-red-50 mb-4">
              <p className="text-xs font-bold text-gray-700 italic">“一次投入，终身获益”</p>
            </div>
            <div className="space-y-1 text-gray-400 text-[11px] font-medium">
              <p>包含：品牌授权、导师指导、现成素材包</p>
              <p>购买合伙人礼包即可即时开启收益</p>
            </div>
          </div>
        </section>

        <section className="mt-16 px-6 mb-8">
          <div className="flex flex-col items-center mb-8">
            <h3 className="text-lg font-extrabold text-gray-800 mb-1">常见问题解答</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Help Center</p>
          </div>
          <div className="space-y-3">
            <details className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]" open>
              <summary className="p-5 font-bold text-sm cursor-pointer list-none flex justify-between items-center text-gray-700 [&::-webkit-details-marker]:hidden">
                <span>加入后需要囤货吗?</span>
                <span className="material-symbols-outlined text-gray-300 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                完全不需要。我们采用最先进的<span className="text-[#991b1b] font-medium">云仓代发</span>模式，您只需负责线上分享。货源采集、分拣、打包及售后物流均由平台总部统一负责。
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
              <summary className="p-5 font-bold text-sm cursor-pointer list-none flex justify-between items-center text-gray-700 [&::-webkit-details-marker]:hidden">
                <span>收益什么时候可以提现?</span>
                <span className="material-symbols-outlined text-gray-300 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                收益实时到账。所有已结算收益均可即时在个人中心申请提现，支持提现至<span className="text-[#991b1b] font-medium">银行卡或微信钱包</span>，通常24小时内到账。
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
              <summary className="p-5 font-bold text-sm cursor-pointer list-none flex justify-between items-center text-gray-700 [&::-webkit-details-marker]:hidden">
                <span>没有推广经验能做吗?</span>
                <span className="material-symbols-outlined text-gray-300 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                当然可以。我们提供<span className="text-[#991b1b] font-medium">导师1对1指导</span>及完整的商学院培训课程。同时提供现成的推文素材、海报和视频，小白也能轻松上手。
              </div>
            </details>
          </div>
        </section>
      </main>

      <div className="absolute bottom-4 left-4 right-4 z-[60]">
        <Link to="/register" className="w-full h-14 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-200 flex items-center justify-between px-8 active:scale-[0.98] transition-all" style={{ background: 'linear-gradient(90deg, #991b1b 0%, #b91c1c 100%)' }}>
          <span className="flex items-center">
            <span className="material-symbols-outlined mr-2">verified_user</span>
            立即成为合伙人
          </span>
          <span className="text-white/80 font-normal">¥3398</span>
        </Link>
      </div>
    </div>
  );
}
