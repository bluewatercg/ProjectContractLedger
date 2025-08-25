import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const PORT = 3003;
const HFS_BASE_URL = 'http://192.168.1.31:81';

// 创建防IDM拦截的PDF代理服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头部 - 必须在所有响应中包含
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Cache-Control');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时缓存预检请求
  
  try {
    // 处理CORS预检请求
    if (req.method === 'OPTIONS') {
      console.log('处理CORS预检请求');
      res.writeHead(200);
      res.end();
      return;
    }

    console.log(`收到请求: ${req.method} ${req.url}`);

    // 处理根路径，返回测试页面
    if (req.url === '/') {
      serveHTMLFile(res, 'test-mvp.html');
    }
    // 处理外部URL查询参数
    else if (req.url.startsWith('/?url=')) {
      const urlParam = decodeURIComponent(req.url.substring(6)); // 移除 '/?url='
      await handleExternalPDF(req, res, urlParam);
    } 
    // 处理PDF请求
    else if (req.url && req.url.includes('.pdf')) {
      const pdfPath = req.url;
      const targetUrl = `${HFS_BASE_URL}${pdfPath}`;
      
      console.log('Base64代理请求:', targetUrl);
      
      // 获取PDF文件数据
      const chunks = [];
      
      const proxyReq = http.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PDF-Viewer/1.0)',
          'Accept': '*/*'
        }
      }, (hfsRes) => {
        
        // 收集所有数据块
        hfsRes.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        hfsRes.on('end', () => {
          try {
            // 合并所有数据块
            const pdfBuffer = Buffer.concat(chunks);
            
            // 将PDF转换为Base64
            const base64Data = pdfBuffer.toString('base64');
            
            // 创建包含Base64数据的JSON响应
            const response = {
              success: true,
              data: base64Data,
              contentType: 'application/pdf',
              size: pdfBuffer.length
            };
            
            // 设置响应头（伪装成JSON API）
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            
            res.writeHead(200);
            res.end(JSON.stringify(response));
            
            console.log(`PDF文件已转换为Base64，大小: ${pdfBuffer.length} bytes`);
            
          } catch (error) {
            console.error('Base64转换错误:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: 'Base64转换失败' }));
          }
        });
        
      }).on('error', (err) => {
        console.error('获取PDF文件错误:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: '无法获取PDF文件' }));
      });
      
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Not Found' }));
    }
    
  } catch (error) {
    console.error('服务器错误:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
  }
});

// 处理外部PDF URL
async function handleExternalPDF(req, res, externalUrl) {
  try {
    console.log('处理外部PDF URL:', externalUrl);
    
    // 确定使用http还是https模块
    const httpModule = externalUrl.startsWith('https:') ? https : http;
    
    // 获取外部PDF文件
    const chunks = [];
    
    const proxyReq = httpModule.get(externalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Viewer/1.0)',
        'Accept': '*/*'
      }
    }, (extRes) => {
      // 检查响应状态
      if (extRes.statusCode !== 200) {
        console.error(`外部服务器返回错误状态: ${extRes.statusCode}`);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: `外部服务器错误: ${extRes.statusCode}` }));
        return;
      }
      
      // 收集数据块
      extRes.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      extRes.on('end', () => {
        try {
          // 合并数据并转换为Base64
          const pdfBuffer = Buffer.concat(chunks);
          const base64Data = pdfBuffer.toString('base64');
          
          const response = {
            success: true,
            data: base64Data,
            contentType: 'application/pdf',
            size: pdfBuffer.length,
            sourceUrl: externalUrl
          };
          
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.writeHead(200);
          res.end(JSON.stringify(response));
          
          console.log(`外部PDF文件已转换为Base64，大小: ${pdfBuffer.length} bytes`);
          
        } catch (error) {
          console.error('Base64转换错误:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Base64转换失败' }));
        }
      });
      
    }).on('error', (err) => {
      console.error('获取外部PDF文件错误:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: `无法获取外部PDF文件: ${err.message}` }));
    });
    
  } catch (error) {
    console.error('处理外部PDF错误:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: '处理外部PDF时发生错误' }));
  }
}

// 提供HTML文件服务
function serveHTMLFile(res, filename) {
  try {
    const filePath = path.join(process.cwd(), filename);
    
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('文件未找到');
      return;
    }
    
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.writeHead(200);
    res.end(htmlContent);
    
    console.log(`提供HTML文件: ${filename}`);
    
  } catch (error) {
    console.error('读取HTML文件错误:', error);
    res.writeHead(500);
    res.end('服务器错误');
  }
}

server.listen(PORT, () => {
  console.log(`PDF Base64代理服务器运行在 http://localhost:${PORT}`);
  console.log(`代理目标: ${HFS_BASE_URL}`);
  console.log('特性: Base64编码传输，防IDM拦截');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭Base64代理服务器...');
  server.close(() => {
    console.log('Base64代理服务器已关闭');
    process.exit(0);
  });
});