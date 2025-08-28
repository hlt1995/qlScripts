//name: Epic免费游戏领取提醒
//cron: 30 7 * * 5

const axios = require('axios');

// 从环境变量获取Bark Key
const BARK_KEY = process.env.BARK_PUSH || process.env.BARK_KEY;
if (!BARK_KEY) {
    console.error('❌ 未找到BARK_PUSH环境变量，请先在青龙面板的配置文件config.sh中配置变量export BARK_PUSH=""');
    process.exit(1);
}
const BARK_API = `https://api.day.app/${BARK_KEY}`;

async function getEpicFreeGames() {
    try {
        const response = await axios.get(
            'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions',
            {
                params: {
                    locale: 'zh-CN',
                    country: 'CN',
                    allowCountries: 'CN'
                },
                timeout: 10000
            }
        );
        
        const elements = response.data?.data?.Catalog?.searchStore?.elements || [];
        const freeGames = [];
        const now = new Date();
        
        elements.forEach(game => {
            if (!game.promotions) return;
            
            // 检查促销信息
            const promotionalOffers = game.promotions.promotionalOffers || [];
            const upcomingOffers = game.promotions.upcomingPromotionalOffers || [];
            
            // 查找有效的免费促销
            let isFree = false;
            let endDate = null;
            
            // 检查当前促销
            for (const offerSet of promotionalOffers) {
                for (const offer of offerSet.promotionalOffers) {
                    if (offer.discountSetting.discountPercentage === 0) {
                        const startDate = new Date(offer.startDate);
                        const endDateObj = new Date(offer.endDate);
                        if (now >= startDate && now <= endDateObj) {
                            isFree = true;
                            endDate = endDateObj;
                            break;
                        }
                    }
                }
                if (isFree) break;
            }
            
            // 检查即将开始的促销
            if (!isFree) {
                for (const offerSet of upcomingOffers) {
                    for (const offer of offerSet.promotionalOffers) {
                        if (offer.discountSetting.discountPercentage === 0) {
                            const startDate = new Date(offer.startDate);
                            const endDateObj = new Date(offer.endDate);
                            // 如果即将在24小时内开始的免费游戏也显示
                            if (startDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
                                isFree = true;
                                endDate = endDateObj;
                                break;
                            }
                        }
                    }
                    if (isFree) break;
                }
            }
            
            // 添加到免费游戏列表
            if (isFree) {
                // 获取游戏图片
                let imageUrl = '';
                const keyImages = game.keyImages || [];
                const offerImage = keyImages.find(img => img.type === 'OfferImageWide');
                const thumbnail = keyImages.find(img => img.type === 'Thumbnail');
                
                if (offerImage) imageUrl = offerImage.url;
                else if (thumbnail) imageUrl = thumbnail.url;
                
                // 修复游戏链接问题 - 使用更可靠的链接格式
                let gameUrl = '';
                
                // 方法1: 尝试从catalogNs获取
                if (game.catalogNs?.mappings?.length > 0) {
                    gameUrl = `https://store.epicgames.com/zh-CN/p/${game.catalogNs.mappings[0].pageSlug}`;
                } 
                // 方法2: 尝试从自定义属性获取
                else if (game.customAttributes?.length > 0) {
                    const productSlugAttr = game.customAttributes.find(
                        attr => attr.key === 'com.epicgames.app.productSlug'
                    );
                    if (productSlugAttr) {
                        gameUrl = `https://store.epicgames.com/zh-CN/p/${productSlugAttr.value}`;
                    }
                }
                // 方法3: 回退到使用ID
                else {
                    gameUrl = `https://store.epicgames.com/p/${game.id}`;
                }
                
                // 格式化结束日期为北京时间
                const beijingOffset = 8 * 60 * 60 * 1000; // UTC+8
                const beijingDate = new Date(endDate.getTime() + beijingOffset);
                const endDateStr = 
                    `${beijingDate.getUTCFullYear()}-${(beijingDate.getUTCMonth() + 1).toString().padStart(2, '0')}-` +
                    `${beijingDate.getUTCDate().toString().padStart(2, '0')} ` +
                    `${beijingDate.getUTCHours().toString().padStart(2, '0')}:${beijingDate.getUTCMinutes().toString().padStart(2, '0')}`;
                
                freeGames.push({
                    title: game.title,
                    url: gameUrl,
                    image: imageUrl,
                    endDate: endDateStr
                });
            }
        });
        
        return freeGames;
    } catch (error) {
        console.error('获取EPIC游戏数据失败:', error.message);
        throw error;
    }
}

async function sendBarkNotification(games) {
    if (games.length === 0) {
        console.log('本周没有免费游戏');
        return;
    }
    
    try {
        // 构造消息内容
        const title = `Epic本周免费游戏 (${games.length}款)`;
        let content = '';
        
        // 添加通用提示
        content += `\n🔗 领取地址：${games.length === 1 ? "点击通知直达" : "点击通知直达"}`;
        
        games.forEach((game, index) => {
            content += `\n🎮 ${index + 1}. ${game.title}`;
            content += `\n⏳ 截止: ${game.endDate} (北京时间)\n`;
            // 不再显示单独的链接行，避免重复
        });
        
        // 智能设置点击行为
        let clickUrl = 'https://store.epicgames.com/free-games'; // 默认跳转总览页
        let copyContent = clickUrl; // 默认复制总览页链接
        
        if (games.length === 1) {
            // 只有一款游戏时，点击直接跳转游戏页面
            clickUrl = games[0].url;
            copyContent = games[0].url; // 复制游戏页链接
        }
        
        // 发送Bark通知
        const payload = {
            title: title,
            body: content,
            url: clickUrl, // 智能设置点击跳转
            automaticallyCopy: 1,
            copy: copyContent, // 智能设置复制内容
            group: 'Epic免费游戏领取提醒', // 修改分组名称
            isArchive: 1 // 保存到历史记录
        };
        
        // 设置通知图标（使用第一个游戏的图片）
        if (games[0].image) {
            payload.icon = games[0].image;
        }
        
        await axios.post(BARK_API, payload);
        
        console.log(`✅ 成功推送 ${games.length} 款免费游戏通知`);
        console.log(`📎 分组名称: Epic周免领取提醒`);
        console.log(`📎 点击跳转: ${clickUrl}`);
        console.log(`📋 复制内容: ${copyContent}`);
    } catch (error) {
        console.error('Bark推送失败:', error.message);
        if (error.response) {
            console.error('Bark响应数据:', error.response.data);
        }
    }
}

async function main() {
    try {
        console.log('🚀 开始获取EPIC免费游戏信息...');
        const freeGames = await getEpicFreeGames();
        
        // 打印调试信息
        console.log(`🎮 找到 ${freeGames.length} 款免费游戏:`);
        freeGames.forEach(game => {
            console.log(`- ${game.title} (截止: ${game.endDate})`);
            console.log(`  🔗 ${game.url}`);
        });
        
        await sendBarkNotification(freeGames);
    } catch (error) {
        console.error('❌ 脚本执行失败:', error.message);
    }
}

main();
