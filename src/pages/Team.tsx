import { Link } from 'react-router-dom';

export default function Team() {
  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800">
        <Link to="/profile" className="flex items-center justify-center text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight pr-6">我的推荐</h1>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <Link to="/team-sales" className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">推荐人员销售额</p>
            </div>
            <p className="text-primary tracking-tight text-2xl font-bold">¥84,320</p>
          </Link>
          <div className="flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">group</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">推荐人数</p>
            </div>
            <p className="text-primary tracking-tight text-3xl font-bold">128</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 pt-2">
        <h3 className="text-slate-900 dark:text-white text-base font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">list_alt</span>
          推荐成员
        </h3>
      </div>

      <div className="flex flex-col gap-px bg-slate-100 dark:bg-slate-800 mt-2">
        {[
          { id: 1, name: '张三', date: '2023-10-24', role: '合伙人', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBCgddr8Bx95u3adYgKLEBX-yyYhcH4rlDRcK6m6qTDLeozQQbozzfKtF1D0-zfI3oWb3wii93g6Nzpz040sRZ6KV1LNELevMtw33i9Hcj3zZPtgkoSYpfrCftR6Cg_zNhU47oejs0bxiZcO-KK_iWQF8-lxCfw9p5CaT8MQ6CbPmtRIJGBwJmiZRCds_6-O680VhRvBt7pHCYfqHMHv5-qW1Dp6iUwKKUY3_Nn1aWHebu9TNTxHskMVP26T6tx0e6Rdr6UTZkT-c', isPartner: true },
          { id: 2, name: '李四', date: '2023-10-25', role: '普通会员', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYRRSgbswL_nJC7vBsjS1UnNH36dv7Fq3kRh4stVTvqKZa-t4_pTOOC3S_PbkQtVQnBCgWgjZLpVIhEJXutbxev_Tq6x3KMvh7W4zwH-8YNY8GR0g9OfdcTqBw5vPrtFz1oxP6FQ_GX1tfey-jU4FyVaE2w3F-qF8wc6NEXhwPEGECadhEmMjS2UmZBAM3zg4ZhN3FjC8ay3z2n4YQxXdnRU25l620lx0ZcKaqp9EFHRJJzQLVBtfsKriRXSh04qe9lSgL85rdx_k', isPartner: false },
          { id: 3, name: '王五', date: '2023-10-26', role: '合伙人', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Ik6PSNBEbcnYtjb9pII1FuRy631THzE4oDm8RXVVmYxc_97PkXgh9VA7N5oYaHFx3DXkj77oJh_00kI7sWTpJRflXnIeOFsPShuFkGao18xlNx7c-s0YhRwfN3K4tleXqiG5uPLVMeij78rdeiymIDY-d9srNsFwol233QV5GOzdeqsjXOvK63AtVfm0Qx9MPj1ncSlNhsNBE7Nw7jMhfNSP-TkDKPcmQ13uGXmHkkB79HpGWyb_5shtfbljOAhOjXH3R3AD5PA', isPartner: true },
          { id: 4, name: '赵六', date: '2023-10-27', role: '普通会员', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzcHnyCWf8YaeZWDuq1FWFG3W3EqM20zWK2oFolVdtTp7DXiT7SS39kwcKam-xsb5m5kfbwSE42iiLQNzduhoV5b9dUdr2MnomqZ8fQSSjRa45cixFpnB8OVNA9B61SEvuy4pt5QFYnUBWj7irGC8r82_1kd-sN6dQO57PgkBBL1pWar4Uv5gMlJFFCjXADs2KmRMqcjal93FNTx5dfJ8OnJP5fgJmnkJA0EbnGZAoRQWJ4ZD3AFKp17aGteni3nyGKIKE8Rd3mmA', isPartner: false },
        ].map(member => (
          <Link to={`/member/${member.id}`} key={member.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-4 justify-between">
            <div className="flex items-center gap-4">
              <div className={`bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border-2 ${member.isPartner ? 'border-primary/10' : 'border-slate-100'}`} style={{ backgroundImage: `url("${member.image}")` }}></div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-900 dark:text-white text-base font-bold leading-tight">{member.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">注册时间：{member.date}</p>
              </div>
            </div>
            <div className="shrink-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.isPartner ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {member.role}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-8 text-center">
        <p className="text-slate-400 text-xs">没有更多成员了</p>
      </div>
    </div>
  );
}
