class Scripts extends HTMLElement {
    constructor() {
        super();
    }
  
    connectedCallback() {
        this.innerHTML = `
            <div class="sparkles" id="sparkles"></div>
        `;
    }
}

class Navigation extends HTMLElement {
    constructor() {
        super();
    }
  
    connectedCallback() {
        this.innerHTML = `
        <div id="layout_nav" class = "layout_nav">
            <div class="dr_nav">
                <ul>
                    <li class="nav_button">
                        <a href="/" class="nav_frontbutton">Home</a>
                    </li>
                    <li class="nav_button">
                        <a href="/minecraft" class="nav_frontbutton">Minecraft</a>
                        <div class="nav_content">
                            <a href="/minecraft/tbh">tbh</a>
                        </div>
                    </li>
                    <li class="nav_button">
                        <a href="/rpgthings" class="nav_frontbutton">RPG Things</a>
                        <div class="nav_content">
                            <a href="/rpgthings/namegen">Name Generators</a>
                            <a href="/rpgthings/namegen">Name Generators 2</a>
                        </div>
                    </li>
                    <li class="nav_button">
                        <a href="/amogus" class="nav_frontbutton">Amogus</a>
                    </li>
                    <li class="nav_button">
                        <a href="/about" class="nav_frontbutton">About</a>
                    </li>
                    <li class="nav_button">
                        <a href="/contact" class="nav_frontbutton">Contact</a>
                    </li>
                </ul>
            </div>
        </div>
      `;
    }
}
class Footer extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
        this.innerHTML = `
        <div id="layout_footer" class="layout_footer">
            <footer>
                <div class="footer_nav">
                    <div class="footer_col">
                        <a>- The Gumgeon -</a>
                        <ul>
                            <li class="desc">
                                The wonderful gumgeon yippe
                                <br>
                                its so great here!
                            </li>
                        </ul>
                    </div>
                    <div class="footer_col">
                        <a>About us</a>
                        <ul>
                            <li><a href="/about">about us</a></li>
                        </ul>
                    </div>
                    <div class="footer_col">
                    <a>Minecraft</a>
                    <ul>
                        <li><a href="https://minecraft.net">minecraft</a></li>
                        <li><a href="https://modrinth.com/user/gummydummy77">modrinth</a></li>
                    </ul>
                </div>
                    <div class="footer_col">
                        <a>Resources</a>
                        <ul>
                            <li><a href="https://en.wikipedia.org/wiki/Markov_chain">markov generators</a></li>
                            <li><a href="http://www.godecookery.com/">badass food</a></li>
                        </ul>
                    </div>
                    <div class="footer_col">
                        <a>Contact Us</a>
                        <ul>
                            <li><a href="/contact">contact</a></li>
                            <li><a href="https://ko-fi.com/gummydummy">ko-fi</a></li>
                            <li><a href="mailto:gummy@gumgeon.xyz" target="_blank" rel="noopener noreferrer">e-mail</a></li>
                        </ul>
                    </div>
                </div>
            
                Hosted on Firebase! 
            </footer>
        </div>
        `;
    }
}
customElements.define('scripts-component', Scripts)
customElements.define('navigation-bar-component', Navigation);  
customElements.define('footer-component', Footer);
  