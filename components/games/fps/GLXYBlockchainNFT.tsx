// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Coins,
  ShoppingCart,
  Trophy,
  Shield,
  Zap,
  TrendingUp,
  Package,
  Star,
  Crown,
  Diamond,
  Gift,
  Award,
  Settings,
  Play,
  ExternalLink,
  Clock,
  Tag,
  Hash,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface NFTAsset {
  id: string;
  name: string;
  description: string;
  type: 'weapon_skin' | 'character' | 'accessory' | 'emote' | 'banner' | 'effect';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  tokenId: string;
  contractAddress: string;
  owner: string;
  price?: string;
  currency: 'ETH' | 'GLXY' | 'USDC';
  image: string;
  attributes: { trait_type: string; value: string }[];
  creator: string;
  createdAt: number;
  listingId?: string;
  isListed: boolean;
}

interface TournamentPrize {
  id: string;
  tournamentName: string;
  prizePool: string;
  currency: string;
  smartContractAddress: string;
  distributionRules: string[];
  participants: string[];
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  winner?: string;
  prizeClaimed: boolean;
}

interface PlayerStats {
  playerId: string;
  walletAddress: string;
  totalWinnings: string;
  tournamentsPlayed: number;
  winRate: number;
  nftPortfolioValue: string;
  achievements: number;
  rank: string;
}

interface SmartContract {
  address: string;
  name: string;
  type: 'tournament' | 'marketplace' | 'staking' | 'governance';
  abi: any[];
  deployedAt: number;
  verified: boolean;
}

interface GLXYBlockchainNFTProps {
  playerId: string;
  walletConnected: boolean;
  onWalletConnect?: (address: string) => void;
  onWalletDisconnect?: () => void;
  gameMode: 'battle-royale' | 'fps' | 'racing';
}

export const GLXYBlockchainNFT: React.FC<GLXYBlockchainNFTProps> = ({
  playerId,
  walletConnected,
  onWalletConnect,
  onWalletDisconnect,
  gameMode
}) => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('Ethereum Mainnet');
  const [balance, setBalance] = useState({ ETH: '0.0', GLXY: '0.0', USDC: '0.0' });

  const [nftAssets, setNftAssets] = useState<NFTAsset[]>([]);
  const [tournamentPrizes, setTournamentPrizes] = useState<TournamentPrize[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [smartContracts, setSmartContracts] = useState<SmartContract[]>([]);

  const [activeTab, setActiveTab] = useState<'inventory' | 'marketplace' | 'tournaments' | 'staking' | 'governance'>('inventory');
  const [showNFTDetails, setShowNFTDetails] = useState<NFTAsset | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null);

  const [listingPrice, setListingPrice] = useState('');
  const [listingCurrency, setListingCurrency] = useState<'ETH' | 'GLXY' | 'USDC'>('ETH');

  const [transactions, setTransactions] = useState<Array<{
    hash: string;
    type: 'buy' | 'sell' | 'mint' | 'transfer' | 'claim' | 'stake' | 'vote';
    asset: string;
    amount: string;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed';
  }>>([]);

  const [stakingAmount, setStakingAmount] = useState('');
  const [stakingRewards, setStakingRewards] = useState('0.0');
  const [governanceProposals, setGovernanceProposals] = useState<Array<{
    id: string;
    title: string;
    description: string;
    votesFor: number;
    votesAgainst: number;
    deadline: number;
    voted: boolean;
  }>>([]);

  // Initialize mock data
  useEffect(() => {
    if (walletConnected) {
      initializeMockData();
    }
  }, [walletConnected]);

  const initializeMockData = () => {
    // Mock NFT Assets
    const mockNFTs: NFTAsset[] = [
      {
        id: '1',
        name: 'GLXY Dragon Flame',
        description: 'Legendary weapon skin with animated fire effects',
        type: 'weapon_skin',
        rarity: 'legendary',
        tokenId: '0x1234...5678',
        contractAddress: '0x9876...5432',
        owner: walletAddress,
        price: '2.5',
        currency: 'ETH',
        image: '🔥',
        attributes: [
          { trait_type: 'Rarity', value: 'Legendary' },
          { trait_type: 'Effect', value: 'Animated Fire' },
          { trait_type: 'Weapon', value: 'Assault Rifle' }
        ],
        creator: '0xabcd...efgh',
        createdAt: Date.now() - 86400000,
        isListed: false
      },
      {
        id: '2',
        name: 'Cosmic Warrior',
        description: 'Epic character skin with cosmic armor',
        type: 'character',
        rarity: 'epic',
        tokenId: '0x2345...6789',
        contractAddress: '0x8765...4321',
        owner: walletAddress,
        price: '1.2',
        currency: 'ETH',
        image: '👨‍🚀',
        attributes: [
          { trait_type: 'Rarity', value: 'Epic' },
          { trait_type: 'Theme', value: 'Cosmic' },
          { trait_type: 'Armor', value: 'Legendary' }
        ],
        creator: '0xbcde...fghi',
        createdAt: Date.now() - 172800000,
        isListed: true,
        listingId: 'list_001'
      },
      {
        id: '3',
        name: 'Victory Dance',
        description: 'Rare emote celebration animation',
        type: 'emote',
        rarity: 'rare',
        tokenId: '0x3456...7890',
        contractAddress: '0x7654...3210',
        owner: walletAddress,
        currency: 'GLXY',
        image: '💃',
        attributes: [
          { trait_type: 'Rarity', value: 'Rare' },
          { trait_type: 'Type', value: 'Celebration' },
          { trait_type: 'Duration', value: '5 seconds' }
        ],
        creator: '0xcdef...ghij',
        createdAt: Date.now() - 259200000,
        isListed: false
      }
    ];

    setNftAssets(mockNFTs);

    // Mock Tournament Prizes
    const mockTournaments: TournamentPrize[] = [
      {
        id: 't1',
        tournamentName: 'GLXY Battle Royale Championship',
        prizePool: '100.0',
        currency: 'ETH',
        smartContractAddress: '0x1111...2222',
        distributionRules: ['50% to 1st place', '30% to 2nd place', '20% to 3rd place'],
        participants: [walletAddress, '0xaaaa...bbbb', '0xcccc...dddd'],
        status: 'active',
        prizeClaimed: false
      },
      {
        id: 't2',
        tournamentName: 'FPS Masters League',
        prizePool: '50.0',
        currency: 'ETH',
        smartContractAddress: '0x3333...4444',
        distributionRules: ['Winner takes all'],
        participants: [walletAddress, '0xeeee...ffff'],
        status: 'completed',
        winner: walletAddress,
        prizeClaimed: false
      }
    ];

    setTournamentPrizes(mockTournaments);

    // Mock Player Stats
    const mockStats: PlayerStats = {
      playerId,
      walletAddress,
      totalWinnings: '12.5',
      tournamentsPlayed: 15,
      winRate: 0.67,
      nftPortfolioValue: '8.75',
      achievements: 23,
      rank: 'Diamond'
    };

    setPlayerStats(mockStats);

    // Mock Smart Contracts
    const mockContracts: SmartContract[] = [
      {
        address: '0x1111...2222',
        name: 'Tournament Manager',
        type: 'tournament',
        abi: [],
        deployedAt: Date.now() - 2592000000,
        verified: true
      },
      {
        address: '0x3333...4444',
        name: 'NFT Marketplace',
        type: 'marketplace',
        abi: [],
        deployedAt: Date.now() - 5184000000,
        verified: true
      },
      {
        address: '0x5555...6666',
        name: 'GLXY Staking Pool',
        type: 'staking',
        abi: [],
        deployedAt: Date.now() - 7776000000,
        verified: true
      }
    ];

    setSmartContracts(mockContracts);

    // Mock Balance
    setBalance({
      ETH: '3.245',
      GLXY: '12500',
      USDC: '5000'
    });

    // Mock Transactions
    const mockTransactions = [
      {
        hash: '0xabc123...def456',
        type: 'buy' as const,
        asset: 'GLXY Dragon Flame',
        amount: '2.5 ETH',
        timestamp: Date.now() - 3600000,
        status: 'confirmed' as const
      },
      {
        hash: '0xdef789...ghi012',
        type: 'mint' as const,
        asset: 'Victory Dance',
        amount: '0.1 ETH',
        timestamp: Date.now() - 7200000,
        status: 'confirmed' as const
      }
    ];

    setTransactions(mockTransactions);

    // Mock Governance Proposals
    const mockProposals = [
      {
        id: 'prop1',
        title: 'Increase Tournament Prize Pools',
        description: 'Proposal to increase tournament prize pools by 25% for the next season',
        votesFor: 1250,
        votesAgainst: 320,
        deadline: Date.now() + 604800000,
        voted: false
      },
      {
        id: 'prop2',
        title: 'New NFT Collection Theme',
        description: 'Introduce cyberpunk-themed NFT collection for next season',
        votesFor: 890,
        votesAgainst: 145,
        deadline: Date.now() + 1209600000,
        voted: true
      }
    ];

    setGovernanceProposals(mockProposals);
  };

  // Wallet connection
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAddress = '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 10);
      setWalletAddress(mockAddress);
      setIsConnecting(false);
      onWalletConnect?.(mockAddress);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    onWalletDisconnect?.();
  };

  // NFT Operations
  const listNFTForSale = async (nft: NFTAsset, price: string, currency: string) => {
    if (!price || parseFloat(price) <= 0) return;

    try {
      // Simulate listing transaction
      const transaction = {
        hash: '0x' + Math.random().toString(16).slice(2, 18),
        type: 'sell' as const,
        asset: nft.name,
        amount: `${price} ${currency}`,
        timestamp: Date.now(),
        status: 'pending' as const
      };

      setTransactions(prev => [transaction, ...prev]);

      // Update NFT status
      setNftAssets(prev => prev.map(asset =>
        asset.id === nft.id
          ? { ...asset, isListed: true, price, currency: currency as 'ETH' | 'GLXY' | 'USDC', listingId: `list_${Date.now()}` }
          : asset
      ));

      setShowListingModal(false);
      setSelectedNFT(null);
      setListingPrice('');

      // Simulate transaction confirmation
      setTimeout(() => {
        setTransactions(prev => prev.map(tx =>
          tx.hash === transaction.hash
            ? { ...tx, status: 'confirmed' as const }
            : tx
        ));
      }, 3000);

    } catch (error) {
      console.error('Listing failed:', error);
    }
  };

  const buyNFT = async (nft: NFTAsset) => {
    if (!nft.price || !nft.isListed) return;

    try {
      // Simulate purchase transaction
      const transaction = {
        hash: '0x' + Math.random().toString(16).slice(2, 18),
        type: 'buy' as const,
        asset: nft.name,
        amount: `${nft.price} ${nft.currency}`,
        timestamp: Date.now(),
        status: 'pending' as const
      };

      setTransactions(prev => [transaction, ...prev]);

      // Update NFT ownership
      setNftAssets(prev => prev.map(asset =>
        asset.id === nft.id
          ? { ...asset, owner: walletAddress, isListed: false, price: undefined, listingId: undefined }
          : asset
      ));

      // Update balance
      const priceFloat = parseFloat(nft.price);
      setBalance(prev => ({
        ...prev,
        [nft.currency]: (parseFloat(prev[nft.currency as keyof typeof prev]) - priceFloat).toString()
      }));

      // Simulate transaction confirmation
      setTimeout(() => {
        setTransactions(prev => prev.map(tx =>
          tx.hash === transaction.hash
            ? { ...tx, status: 'confirmed' as const }
            : tx
        ));
      }, 3000);

    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const claimTournamentPrize = async (tournament: TournamentPrize) => {
    if (tournament.prizeClaimed || tournament.status !== 'completed' || tournament.winner !== walletAddress) {
      return;
    }

    try {
      // Simulate claiming transaction
      const transaction = {
        hash: '0x' + Math.random().toString(16).slice(2, 18),
        type: 'claim' as const,
        asset: tournament.tournamentName,
        amount: `${tournament.prizePool} ${tournament.currency}`,
        timestamp: Date.now(),
        status: 'pending' as const
      };

      setTransactions(prev => [transaction, ...prev]);

      // Update tournament status
      setTournamentPrizes(prev => prev.map(t =>
        t.id === tournament.id
          ? { ...t, prizeClaimed: true }
          : t
      ));

      // Update balance
      setBalance(prev => ({
        ...prev,
        [tournament.currency]: (parseFloat(prev[tournament.currency as keyof typeof prev]) + parseFloat(tournament.prizePool)).toString()
      }));

      // Update player stats
      if (playerStats) {
        setPlayerStats({
          ...playerStats,
          totalWinnings: (parseFloat(playerStats.totalWinnings) + parseFloat(tournament.prizePool)).toString()
        });
      }

      // Simulate transaction confirmation
      setTimeout(() => {
        setTransactions(prev => prev.map(tx =>
          tx.hash === transaction.hash
            ? { ...tx, status: 'confirmed' as const }
            : tx
        ));
      }, 3000);

    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  const stakeTokens = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      // Simulate staking transaction
      const transaction = {
        hash: '0x' + Math.random().toString(16).slice(2, 18),
        type: 'stake' as const,
        asset: 'GLXY Tokens',
        amount: `${amount} GLXY`,
        timestamp: Date.now(),
        status: 'pending' as const
      };

      setTransactions(prev => [transaction, ...prev]);

      // Update balance
      setBalance(prev => ({
        ...prev,
        GLXY: (parseFloat(prev.GLXY) - parseFloat(amount)).toString()
      }));

      // Calculate rewards (simplified)
      const rewardAmount = parseFloat(amount) * 0.1; // 10% APY
      setStakingRewards(prev => (parseFloat(prev) + rewardAmount).toString());

      // Simulate transaction confirmation
      setTimeout(() => {
        setTransactions(prev => prev.map(tx =>
          tx.hash === transaction.hash
            ? { ...tx, status: 'confirmed' as const }
            : tx
        ));
      }, 3000);

      setStakingAmount('');

    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  const voteOnProposal = async (proposalId: string, support: boolean) => {
    try {
      // Simulate voting transaction
      const transaction = {
        hash: '0x' + Math.random().toString(16).slice(2, 18),
        type: 'vote' as const,
        asset: `Proposal ${proposalId}`,
        amount: support ? 'Support' : 'Against',
        timestamp: Date.now(),
        status: 'pending' as const
      };

      setTransactions(prev => [transaction, ...prev]);

      // Update proposal
      setGovernanceProposals(prev => prev.map(p =>
        p.id === proposalId
          ? {
              ...p,
              voted: true,
              votesFor: support ? p.votesFor + 1 : p.votesFor,
              votesAgainst: !support ? p.votesAgainst + 1 : p.votesAgainst
            }
          : p
      ));

      // Simulate transaction confirmation
      setTimeout(() => {
        setTransactions(prev => prev.map(tx =>
          tx.hash === transaction.hash
            ? { ...tx, status: 'confirmed' as const }
            : tx
        ));
      }, 3000);

    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500';
      case 'rare': return 'border-blue-500';
      case 'epic': return 'border-purple-500';
      case 'legendary': return 'border-orange-500';
      case 'mythic': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-600 to-gray-800';
      case 'rare': return 'from-blue-600 to-blue-800';
      case 'epic': return 'from-purple-600 to-purple-800';
      case 'legendary': return 'from-orange-600 to-orange-800';
      case 'mythic': return 'from-red-600 to-red-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Diamond className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-blue-400">GLXY BLOCKCHAIN & NFT</h1>
          <Badge className="bg-blue-600">{gameMode.toUpperCase()}</Badge>
        </div>

        <div className="flex items-center space-x-4">
          {/* Network Selector */}
          <select
            value={currentNetwork}
            onChange={(e) => setCurrentNetwork(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-sm"
          >
            <option>Ethereum Mainnet</option>
            <option>Polygon</option>
            <option>BSC</option>
            <option>Arbitrum</option>
          </select>

          {/* Wallet Connection */}
          {walletConnected ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-gray-900 border border-green-600 rounded-lg px-3 py-2">
                <Wallet className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-400">{walletAddress}</span>
              </div>
              <Button
                onClick={disconnectWallet}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4 mr-2" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>

      {walletConnected && (
        <>
          {/* Balance Display */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-900 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">ETH Balance</div>
                    <div className="text-xl font-bold text-white">{balance.ETH}</div>
                  </div>
                  <Coins className="w-6 h-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">GLXY Tokens</div>
                    <div className="text-xl font-bold text-white">{balance.GLXY}</div>
                  </div>
                  <Zap className="w-6 h-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">USDC Balance</div>
                    <div className="text-xl font-bold text-white">${balance.USDC}</div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {playerStats && (
              <Card className="bg-gray-900 border-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Portfolio Value</div>
                      <div className="text-xl font-bold text-white">${playerStats.nftPortfolioValue}</div>
                    </div>
                    <Crown className="w-6 h-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 border-b border-gray-800">
            {[
              { id: 'inventory', label: 'Inventory', icon: Package },
              { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
              { id: 'tournaments', label: 'Tournaments', icon: Trophy },
              { id: 'staking', label: 'Staking', icon: Shield },
              { id: 'governance', label: 'Governance', icon: Settings }
            ].map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-blue-600' : 'text-gray-400 hover:text-white'}
              >
                {React.createElement(tab.icon, {
                    className: "w-4 h-4 mr-2"
                  })}
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nftAssets.map(nft => (
                <Card key={nft.id} className={`bg-gray-900 border-2 ${getRarityColor(nft.rarity)} cursor-pointer hover:scale-105 transition-transform`}>
                  <CardContent className="p-4">
                    <div className={`h-32 bg-gradient-to-br ${getRarityGradient(nft.rarity)} rounded-lg flex items-center justify-center mb-3`}>
                      <span className="text-6xl">{nft.image}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{nft.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{nft.description}</p>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`bg-gradient-to-r ${getRarityGradient(nft.rarity)} text-white`}>
                        {nft.rarity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">{nft.type.replace('_', ' ')}</span>
                    </div>
                    {nft.isListed && nft.price && (
                      <div className="text-center p-2 bg-green-900/30 rounded mb-2">
                        <div className="text-green-400 font-semibold">{nft.price} {nft.currency}</div>
                        <div className="text-xs text-green-300">Listed for sale</div>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => setShowNFTDetails(nft)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                      {!nft.isListed && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedNFT(nft);
                            setShowListingModal(true);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          Sell
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nftAssets.filter(nft => nft.isListed).map(nft => (
                <Card key={nft.id} className={`bg-gray-900 border-2 ${getRarityColor(nft.rarity)}`}>
                  <CardContent className="p-4">
                    <div className={`h-32 bg-gradient-to-br ${getRarityGradient(nft.rarity)} rounded-lg flex items-center justify-center mb-3`}>
                      <span className="text-6xl">{nft.image}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{nft.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{nft.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`bg-gradient-to-r ${getRarityGradient(nft.rarity)} text-white`}>
                        {nft.rarity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">{nft.type.replace('_', ' ')}</span>
                    </div>
                    <div className="text-center p-3 bg-green-900/30 rounded mb-3">
                      <div className="text-green-400 font-bold text-lg">{nft.price} {nft.currency}</div>
                      <div className="text-xs text-green-300">Current Price</div>
                    </div>
                    <Button
                      onClick={() => buyNFT(nft)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className="space-y-6">
              {tournamentPrizes.map(tournament => (
                <Card key={tournament.id} className="bg-gray-900 border-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">{tournament.tournamentName}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={tournament.status === 'active' ? 'bg-green-600' : tournament.status === 'completed' ? 'bg-blue-600' : 'bg-gray-600'}>
                          {tournament.status.toUpperCase()}
                        </Badge>
                        {tournament.status === 'completed' && tournament.winner === walletAddress && !tournament.prizeClaimed && (
                          <Button
                            onClick={() => claimTournamentPrize(tournament)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Claim Prize
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Prize Pool</div>
                        <div className="text-lg font-bold text-white">{tournament.prizePool} {tournament.currency}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Participants</div>
                        <div className="text-lg font-bold text-white">{tournament.participants.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Smart Contract</div>
                        <div className="text-sm font-mono text-blue-400">{tournament.smartContractAddress}</div>
                      </div>
                    </div>
                    {tournament.winner && (
                      <div className="mt-4 p-3 bg-green-900/30 rounded">
                        <div className="text-green-400 font-semibold">Winner: {tournament.winner}</div>
                        {tournament.prizeClaimed && (
                          <div className="text-green-300 text-sm">Prize claimed successfully</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'staking' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-green-500">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>GLXY Staking Pool</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-900/30 rounded">
                    <div className="text-sm text-gray-400">Current Rewards</div>
                    <div className="text-2xl font-bold text-green-400">{stakingRewards} GLXY</div>
                    <div className="text-xs text-green-300">10% APY</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Stake Amount</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={stakingAmount}
                        onChange={(e) => setStakingAmount(e.target.value)}
                        placeholder="Enter GLXY amount"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                      <Button
                        onClick={() => stakeTokens(stakingAmount)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Stake
                      </Button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Available: {balance.GLXY} GLXY
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-purple-500">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Staking Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Total Staked</div>
                      <div className="text-lg font-bold text-white">2.5M GLXY</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Your Stake</div>
                      <div className="text-lg font-bold text-purple-400">15,000 GLXY</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Pool Share</div>
                      <div className="text-lg font-bold text-white">0.6%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Lock Period</div>
                      <div className="text-lg font-bold text-white">30 days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-6">
              {governanceProposals.map(proposal => (
                <Card key={proposal.id} className="bg-gray-900 border-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                      <Badge className={proposal.voted ? "bg-blue-600" : "bg-gray-600"}>
                        {proposal.voted ? 'VOTED' : 'NOT VOTED'}
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-4">{proposal.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400">Votes For</div>
                        <div className="text-lg font-bold text-green-400">{proposal.votesFor}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Votes Against</div>
                        <div className="text-lg font-bold text-red-400">{proposal.votesAgainst}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Deadline</div>
                        <div className="text-sm text-white">
                          {new Date(proposal.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {!proposal.voted && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => voteOnProposal(proposal.id, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Vote For
                        </Button>
                        <Button
                          onClick={() => voteOnProposal(proposal.id, false)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Vote Against
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Transactions */}
          <Card className="bg-gray-900 border-gray-700 mt-8">
            <CardHeader>
              <CardTitle className="text-gray-400 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Transactions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.hash} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        tx.status === 'confirmed' ? 'bg-green-500' :
                        tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="text-sm text-white">{tx.asset}</div>
                        <div className="text-xs text-gray-400">{tx.type.toUpperCase()} • {tx.amount}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{tx.hash}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!walletConnected && (
        <div className="text-center py-16">
          <Wallet className="w-24 h-24 mx-auto mb-4 text-gray-600 opacity-50" />
          <h2 className="text-2xl font-semibold text-gray-400 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-500 mb-6">Connect your wallet to access NFT marketplace, tournaments, and blockchain features</p>
          <Button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      )}

      {/* NFT Details Modal */}
      {showNFTDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-blue-500 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-400">{showNFTDetails.name}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowNFTDetails(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`h-48 bg-gradient-to-br ${getRarityGradient(showNFTDetails.rarity)} rounded-lg flex items-center justify-center`}>
                <span className="text-8xl">{showNFTDetails.image}</span>
              </div>
              <p className="text-gray-300">{showNFTDetails.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Type</div>
                  <div className="text-white">{showNFTDetails.type.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Rarity</div>
                  <Badge className={`bg-gradient-to-r ${getRarityGradient(showNFTDetails.rarity)} text-white`}>
                    {showNFTDetails.rarity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Token ID</div>
                  <div className="text-sm font-mono text-blue-400">{showNFTDetails.tokenId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Contract</div>
                  <div className="text-sm font-mono text-blue-400">{showNFTDetails.contractAddress}</div>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Attributes</h4>
                <div className="flex flex-wrap gap-2">
                  {showNFTDetails.attributes.map((attr, index) => (
                    <div key={index} className="px-3 py-1 bg-gray-800 rounded text-sm">
                      <span className="text-gray-400">{attr.trait_type}:</span>
                      <span className="text-white ml-1">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div>
                  <div className="text-sm text-gray-400">Creator</div>
                  <div className="text-sm font-mono text-purple-400">{showNFTDetails.creator}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Created</div>
                  <div className="text-sm text-white">{new Date(showNFTDetails.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Listing Modal */}
      {showListingModal && selectedNFT && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-green-500 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-green-400">List NFT for Sale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{selectedNFT.name}</div>
                <div className="text-sm text-gray-400">{selectedNFT.type.replace('_', ' ')}</div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Price</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="Enter price"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  />
                  <select
                    value={listingCurrency}
                    onChange={(e) => setListingCurrency(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="ETH">ETH</option>
                    <option value="GLXY">GLXY</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowListingModal(false);
                    setSelectedNFT(null);
                    setListingPrice('');
                  }}
                  className="flex-1 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => listNFTForSale(selectedNFT, listingPrice, listingCurrency)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  List for Sale
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};