
import { parse } from "cookie";

const auth_url = "https://geekr.cloudflareaccess.com/cdn-cgi/access/get-identity"
const COOKIE_NAME = "CF_Authorization";

export default {
	async fetch(request,env) {		
		const url = new URL(request.url);
		 // Enable Passthrough to allow direct access to control and test routes.
		 if (url.pathname.endsWith("/secure")|| url.pathname.endsWith("secure/") ) {
		 const cookie = parse(request.headers.get("Cookie") || "");
		 //check having cookie information
		 try {
			 if (cookie[COOKIE_NAME] != null) {
				 const response = await fetch(auth_url, {
					 headers: {
						 'Cookie': `${COOKIE_NAME}=${cookie[COOKIE_NAME]}`,
					 }
 
				 });
				 const login_info = await response.json();				
 
				 const email = login_info["email"];
				 const country = login_info["geo"]["country"];
				 const login_time = new Date(login_info["iat"] * 1000).toString();
				 const html = `<!DOCTYPE html>
					<body>
					<h1>${email} authenticated at ${login_time} from 
					<a href="https://tunnel.v21.xyz/secure/${country}">${country}</a></h1>
					<br>			
					</body>`;
				 return new Response(html,
					 {
						 headers: {
							 "content-type": "text/html;charset=UTF-8",
						 }
					 });
 
			 }
			 return new Response("No cookie with name: " + COOKIE_NAME);
 
			 //catch error 
		 } catch (err) {
			 const stack = JSON.stringify(err.stack) || err;
			 response = new Response(stack, response);
			 response.headers.set("X-Debug-stack", stack);
			 response.headers.set("X-Debug-err", err);
			 return new Response(response);
		 }
	 }
	 else{
		//handle r2 image request
		const key = url.pathname.split('/').pop();
		// Retrieve the key "country"
		const r2_key = key.toLocaleLowerCase()+'.png';
		console.log(r2_key);
		const object = await env.MY_BUCKET.get(r2_key)
		if (object === null) {
			return new Response('Object Not Found', { status: 404 });
		  }
		  const headers = new Headers();
		  object.writeHttpMetadata(headers);
		  headers.set('etag', object.httpEtag);
		  return new Response(object.body, {
			headers,
		  });

	  }
	} 	
};
