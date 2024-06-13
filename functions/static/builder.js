class Scripts extends HTMLElement {
    constructor() {
        super();
    }
  
    connectedCallback() {
        this.innerHTML = `
            <div class="sparkles" id="sparkles"></div>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet">
            <link rel="icon" type="image/x-icon" href="/static/favicon.ico">
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
                        <a href="/minecraft" class="nav_frontbutton">Minecraft ↓</a>
                        <div class="nav_content">
                            <a href="/minecraft/tbh">tbh</a>
                            <a href="/minecraft/corkboard">corkboard</a>
                        </div>
                    </li>
                    <li class="nav_button">
                        <a href="/projects" class="nav_frontbutton">Projects</a>

                    </li>
                    <li class="nav_button">
                        <a href="/rpgthings" class="nav_frontbutton">RPG Things ↓</a>
                        <div class="nav_content">
                            <a href="/rpgthings/namegen">Name Generators</a>
                        </div>
                    </li>
                    <li class="nav_button">
                        <a href="/art" class="nav_frontbutton">Art</a>
                    </li>
                    <li class="nav_button">
                        <a href="/about" class="nav_frontbutton">About ↓</a>
                        <div class="nav_content">
                            <a href="/about/pronouns">Pronouns</a>
                            <a href="/about/family">Plushies</a>
                        </div>
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
                        <p>- The Gumgeon -</p>
                        <ul>
                            <li class="desc">
                                the wonderful gumgeon yippee
                                <br>
                                its so great here!
                            </li>
                        </ul>
                    </div>
                    <div class="footer_col">
                        <p>About us</p>
                        <ul>
                            <li><a href="/about">about us</a></li>
                            <li><a href="https://github.com/gummy77">github</a></li>
                            <li><a href="https://liberalgummy.itch.io/">itch.io</a></li>
                        </ul>
                    </div>
                    <div class="footer_col">
                    <p>Minecraft</p>
                    <ul>
                        <li><a href="https://minecraft.net">minecraft</a></li>
                        <li><a href="https://modrinth.com/user/gummydummy77">modrinth</a></li>
                    </ul>
                </div>
                    <div class="footer_col">
                        <p>Resources</p>
                        <ul>
                            <li><a href="https://en.wikipedia.org/wiki/Markov_chain">markov generators</a></li>
                            <li><a href="http://www.godecookery.com/">badass food</a></li>
                        </ul>
                    </div>
                    <div class="footer_col">
                        <p>Contact Us</p>
                        <ul>
                            <li><a href="/contact">contact</a></li>
                            <li><a href="https://ko-fi.com/gummydummy">ko-fi</a></li>
                            <li><a href="mailto:gummy@gumgeon.xyz" target="_blank" rel="noopener noreferrer">e-mail</a></li>
                        </ul>
                    </div>
                </div>
                <br><br>
                Gumgeon 1.3.0 - x - Hosted on Firebase!
            </footer>
        </div>
        `;
    }
}
customElements.define('scripts-component', Scripts)
customElements.define('navigation-bar-component', Navigation);  
customElements.define('footer-component', Footer);
  